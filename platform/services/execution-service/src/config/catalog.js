/**
 * Catalogue des logiciels installables via SSH.
 *
 * Pour ajouter un logiciel :
 *   1. Ajoute une entrée ici avec une key unique (snake_case, sans espaces).
 *   2. installCommands : tableau de commandes shell exécutées en séquence.
 *      Si une commande renvoie un code de sortie non nul, l'installation échoue.
 *   3. verifyCommand : commande exécutée en dernier pour confirmer l'install.
 *      Elle doit retourner exit code 0 si le logiciel est bien installé.
 *
 * Hypothèses :
 *   - Cibles Debian/Ubuntu uniquement (apt-get).
 *   - L'utilisateur SSH a les droits root ou sudo NOPASSWD.
 *   - DEBIAN_FRONTEND=noninteractive évite les prompts interactifs d'apt.
 */
module.exports = {
  nginx: {
    key: 'nginx',
    displayName: 'Nginx',
    description: 'Serveur web haute performance et reverse proxy',
    installCommands: [
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y nginx',
    ],
    verifyCommand: 'nginx -v',
  },

  nodejs: {
    key: 'nodejs',
    displayName: 'Node.js 20 LTS',
    description: 'Runtime JavaScript côté serveur (version LTS)',
    installCommands: [
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates',
      'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs',
    ],
    verifyCommand: 'node --version',
  },

  postgresql: {
    key: 'postgresql',
    displayName: 'PostgreSQL 16',
    description: 'Système de gestion de base de données relationnelle',
    installCommands: [
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib',
    ],
    verifyCommand: 'psql --version',
  },

  docker: {
    key: 'docker',
    displayName: 'Docker Engine',
    description: 'Plateforme de conteneurisation (Docker-in-Docker non garanti en environnement conteneurisé)',
    installCommands: [
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg lsb-release',
      'install -m 0755 -d /etc/apt/keyrings',
      'curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc',
      'chmod a+r /etc/apt/keyrings/docker.asc',
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list',
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
    ],
    verifyCommand: 'docker --version',
  },

  htop: {
    key: 'htop',
    displayName: 'htop',
    description: 'Moniteur de processus interactif — bon exemple minimal pour tester le flux',
    installCommands: [
      'apt-get update -qq',
      'DEBIAN_FRONTEND=noninteractive apt-get install -y htop',
    ],
    verifyCommand: 'htop --version',
  },
};
