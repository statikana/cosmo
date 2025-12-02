install apache 2.4 httpd for windows into c:/apache24

register as net service: `c:/apache24/bin/httpd.exe -k install -n cosmo -conf ./apache/cosmo.conf`

check syntax etc: `c:/apache24/bin/httpd.exe -n cosmo -t`

using service: `net start/stop cosmo`
