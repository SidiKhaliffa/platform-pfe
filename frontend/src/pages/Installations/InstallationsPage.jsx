import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getCatalog, getJobs, getJob, installSoftware } from '../../api/execution';
import { getServers } from '../../api/servers';
import InstallForm from '../../components/InstallForm/InstallForm';
import JobList from '../../components/JobList/JobList';
import JobDetail from '../../components/JobDetail/JobDetail';
import './InstallationsPage.css';

const POLL_DELAY = 4000; // ms entre chaque poll (setTimeout pattern)

export default function InstallationsPage() {
  const { user } = useAuth();
  const canInstall = ['ADMIN', 'OPERATOR'].includes(user?.role);

  // ── Données statiques (chargées une fois) ────────────────────────────────
  const [catalog,   setCatalog]   = useState([]);
  const [servers,   setServers]   = useState([]);
  const [initErr,   setInitErr]   = useState('');

  // ── Jobs (soumis au polling) ─────────────────────────────────────────────
  const [jobs,      setJobs]      = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsErr,   setJobsErr]   = useState('');

  // ── Détail du job sélectionné ────────────────────────────────────────────
  const [selectedJob, setSelectedJob] = useState(null);
  // Ref pour accéder à l'id sélectionné dans loadAll (évite la stale closure)
  const selectedJobIdRef = useRef(null);

  // ── Soumission du formulaire ─────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Chargement initial (catalogue + serveurs) ────────────────────────────
  useEffect(() => {
    Promise.all([getCatalog(), getServers()])
      .then(([cat, srvs]) => { setCatalog(cat); setServers(srvs); })
      .catch((err) => setInitErr(err.response?.data?.error?.message || 'Erreur de chargement du catalogue'));
  }, []);

  // ── loadAll : récupère les jobs + rafraîchit le détail si actif ──────────
  const loadAll = useCallback(async (silent = false) => {
    try {
      const data = await getJobs();
      setJobs(data);
      setJobsErr('');

      // Si un job est sélectionné et encore actif → rafraîchir son détail
      const selId = selectedJobIdRef.current;
      if (selId) {
        const inList = data.find((j) => j.id === selId);
        if (inList?.status === 'PENDING' || inList?.status === 'RUNNING') {
          const detail = await getJob(selId);
          setSelectedJob(detail);
        }
      }
    } catch (err) {
      if (!silent) setJobsErr(err.response?.data?.error?.message || 'Erreur de chargement des jobs');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Chargement initial des jobs
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Polling — setTimeout pour éviter les appels qui se chevauchent ───────
  // Le return () => clearTimeout(id) nettoie proprement quand :
  //   - la liste des jobs change (nouvel état reçu)
  //   - l'utilisateur quitte la page (unmount du composant)
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'PENDING' || j.status === 'RUNNING');
    if (!hasActive) return;
    const id = setTimeout(() => loadAll(true), POLL_DELAY);
    return () => clearTimeout(id);
  }, [jobs, loadAll]);

  // ── Ouvrir / fermer le panneau de détail ─────────────────────────────────
  const openJob = async (job) => {
    if (selectedJobIdRef.current === job.id) {
      // Toggle : fermer si déjà ouvert
      setSelectedJob(null);
      selectedJobIdRef.current = null;
      return;
    }
    selectedJobIdRef.current = job.id;
    try {
      const detail = await getJob(job.id);
      setSelectedJob(detail);
    } catch (err) {
      setJobsErr(err.response?.data?.error?.message || 'Impossible de charger les détails du job');
    }
  };

  const closeJob = () => {
    setSelectedJob(null);
    selectedJobIdRef.current = null;
  };

  // ── Déclencher une installation ───────────────────────────────────────────
  const handleInstall = async (serverId, softwareKey) => {
    setSubmitting(true);
    setSuccessMsg('');
    setJobsErr('');
    try {
      const { jobId } = await installSoftware(serverId, softwareKey);

      // Recharger la liste pour inclure le nouveau job
      await loadAll();

      // Auto-ouvrir le détail du job créé
      selectedJobIdRef.current = jobId;
      const detail = await getJob(jobId);
      setSelectedJob(detail);

      const srv = servers.find((s) => s.id === serverId);
      const sw  = catalog.find((c) => c.key === softwareKey);
      const msg = `Installation de ${sw?.displayName ?? softwareKey} lancée sur ${srv?.hostname ?? serverId}.`;
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setJobsErr(err.response?.data?.error?.message || "Erreur lors du déclenchement de l'installation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Installations</h1>
      </div>

      {initErr   && <div className="state-msg state-msg--error">{initErr}</div>}
      {jobsErr   && <div className="state-msg state-msg--error">{jobsErr}</div>}
      {successMsg && <div className="success-banner" role="status">{successMsg}</div>}

      {canInstall && catalog.length > 0 && servers.length > 0 && (
        <InstallForm
          catalog={catalog}
          servers={servers}
          onInstall={handleInstall}
          submitting={submitting}
        />
      )}

      {jobsLoading ? (
        <div className="state-msg">Chargement des jobs…</div>
      ) : (
        <JobList
          jobs={jobs}
          selectedJobId={selectedJob?.id}
          onSelect={openJob}
        />
      )}

      {selectedJob && (
        <JobDetail job={selectedJob} onClose={closeJob} />
      )}
    </div>
  );
}
