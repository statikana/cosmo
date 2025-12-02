1. install apache 2.4 httpd for windows into c:/apache24

2. register as net service: `c:/apache24/bin/httpd.exe -k install -n cosmo -conf ./apache/cosmo.conf`

3. check syntax etc: `c:/apache24/bin/httpd.exe -n cosmo -t`

4. using service: `net start/stop cosmo`
