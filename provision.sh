#!/bin/bash

apt update -y

# install all the needed dependencies
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt install -y nodejs
apt install -y nginx
npm i -g remake pm2
pm2 startup systemd

# create deployment remake project
# soon to be replaced with a multi-tenant remake project
mkdir -p /opt/remake
cd /opt/remake
remake create deployment # --multi-tenant

# build web app and start remake server
cd deployment
npm run build
pm2 start /opt/remake/deployment/server.js --name remake-server

# install mariadb
apt install -y mariadb

# SSL
apt update
apt install -y software-properties-common
add-apt-repository universe
add-apt-repository ppa:certbot/certbot -y
apt update

apt install certbot python-certbot-nginx -y
apt install python3-certbot-dns-digitalocean -y

# TODO: copy dns-digitalocean-credentials
chmod 600 ~/dns-digitalocean-credentials

certbot certonly --dns-digitalocean --dns-digitalocean-credentials \
        ~/dns-digitalocean-credentials -d remakeapps.com -d *.remakeapps.com

# needs manual input
# TODO: replace this with copying actual nginx config for /
certbot --nginx                 # configure nginx
sudo certbot renew --dry-run    # auto-renew

# restart nginx
service restart nginx

# NOTE: generate nginx configs for subdomains while deploying starting from template

# INFO: to move files to the server with scp use these commands
# scp -i ~/.ssh/remake-ct /path/to/file root@159.89.45.187:/destination/path/on/server
# scp -R -i ~/.ssh/remake-ct /path/to/dir root@159.89.45.187:/destination/path/on/server

# INFO: to move files from the server to local machine with scp use these commands
# scp -i ~/.ssh/remake-ct root@159.89.45.187:/path/to/file/on/server /local/path
# scp -R -i ~/.ssh/remake-ct root@159.89.45.187:/path/to/dir/on/server /local/path