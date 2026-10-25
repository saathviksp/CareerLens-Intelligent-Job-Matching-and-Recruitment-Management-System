#!/bin/bash
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf
if ! grep -q "host    all             all             all                     trust" /etc/postgresql/16/main/pg_hba.conf; then
    echo "host    all             all             all                     trust" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
fi
sudo service postgresql restart
sudo ss -tulpn | grep 5432
