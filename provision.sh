#!/bin/bash

apt update -y

# install all the needed dependencies
apt install -y nodejs npm nginx
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

# forward requests from :3000 to :80 via nginx
sed -i "51s/try_files \$uri \$uri\/ =404;/proxy_pass http:\/\/127.0.0.1:3000\/;/" /etc/nginx/sites-available/default
service restart nginx

# TODO: add server_name remakeapps.com www.remakeapps.com

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

# needs manual input
certbot certonly --dns-digitalocean --dns-digitalocean-credentials \
        ~/dns-digitalocean-credentials -d remakeapps.com -d *.remakeapps.com

# needs manual input
certbot --nginx                 # configure nginx
sudo certbot renew --dry-run    # auto-renew