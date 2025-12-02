#!/bin/bash
# only works for my local.

# install using this config
c:/apache24/bin/httpd.exe -k install -n cosmo -f ./apache/cosmo.conf

# exec
c:/apache24/bin/httpd.exe -n cosmo
