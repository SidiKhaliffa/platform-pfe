# Serveur SSH Ubuntu minimal pour tester l'execution-service en local.
# NE PAS utiliser en production.
FROM ubuntu:22.04
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server && \
    mkdir -p /run/sshd && \
    echo 'root:rootpass' | chpasswd && \
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/'          /etc/ssh/sshd_config && \
    sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
