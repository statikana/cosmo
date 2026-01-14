very simple code for a locally hosted/served file server, not actually hosted anywhere right now. was previously used with a https://tailscale.com network.

uses python's default threading module to write uploaded files to storage w/o blocking network IO (not like it actually matters, because nobody's every used this except for me).

1. install apache 2.4 httpd for windows into c:/apache24

2. register as net service: `c:/apache24/bin/httpd.exe -k install -n cosmo -f .../apache/cosmo.conf`

3. check syntax etc: `c:/apache24/bin/httpd.exe -n cosmo -t`

4. using service: `net start/stop cosmo`


also use a py venv idk

`static` handles static pages and are delivered by apache, all other requests are routed through `scripts/wsgi.py` using `mod_wsgi` for apache.
