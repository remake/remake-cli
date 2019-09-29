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

# forward requests from :3000 to :80 via nginx
sed -i "51s/try_files \$uri \$uri\/ =404;/proxy_pass http:\/\/127.0.0.1:3000\/;/" /etc/nginx/sites-available/default
service restart nginx