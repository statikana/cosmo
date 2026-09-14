# cosmo

Cosmo is a small self-hosted file server. It's a web app you run on your own machine (and, optionally, your own network) to push files to and pull them from over plain HTTP. Just a browser and an endpoint.

It isn't hosted anywhere right now, but it has been previously ran over a [Tailscale](https://tailscale.com) network, which is exactly what the TLS config in `apache/httpd-ssl.conf` is still set up for.

## How it works

- Apache 2.4 serves the static front end and hands everything else off to a small Python WSGI app via `mod_wsgi`.
- The front end (`site/cosmo/index.html`, `index.js`, `index.css`) is a single-page upload/download UI. Uploads post into a hidden iframe; downloads and deletes are handled by a modest amount of vanilla JS.
- The backend (`site/cosmo/cosmo_wsgi.py`) is deliberately small and handles exactly two routes:
  - `POST /cosmo/upload` — accepts a `multipart/form-data` upload (field name `uploaded-files`), writes each file to `site/cosmo/media/`, then appends an entry (remote IP, timestamp, size) to `data.json`.
  - `POST /cosmo/delete` — reads a `filenames` query parameter and removes the matching files on disk along with their metadata.
- Writes to `data.json` are serialized behind a `threading.Lock` so concurrent uploads don't clobber each other. (It's never been load-tested, but the thought counts.)
- Anything that isn't one of those two routes returns a `500`. On purpose.

Uploaded files live in `site/cosmo/media/`, which is gitignored so create it if it doesn't exist.
## Requirements

- Windows (I don't even run Windows any more, but I might make a transport to Linux in the future)
- Apache 2.4 httpd installed to `c:/apache24` (all the scripts assume this path)
- Python 3.12+ — the code relies on `match`/`case` pattern matching and built-in generics; the Apache config points at 3.13
- The [`multipart`](https://pypi.org/project/multipart/) package (python-multipart) in a venv
- `mod_wsgi` for Apache, built against your Python version (the config loads `mod_wsgi.cp313-win_amd64.pyd` from Python's site-packages)

## Setup

1. Install Apache 2.4 for Windows into `c:/apache24`. If you put it somewhere else, update the paths in `apache/cosmo.conf`.
2. Create a Python venv (the config expects `<repo>/.venv`) and `pip install multipart` into it. If your venv lives elsewhere, fix `WSGIPythonHome` in `apache/cosmo.conf`.
3. Register cosmo as a Windows service:

   ```
   c:/apache24/bin/httpd.exe -k install -n cosmo -f .../apache/cosmo.conf
   ```

4. Check the config:

   ```
   c:/apache24/bin/httpd.exe -n cosmo -t
   ```

5. Start it:

   ```
   net start cosmo
   ```

   (`net stop cosmo` to take it back down.)

There are also two convenience scripts: `restart.bat` bounces the service, and `rebuild.bat` does a full stop/uninstall/reinstall/start cycle.

## HTTPS

`apache/httpd-ssl.conf` wires up a TLS virtual host on port 443 with the usual hardening. It expects a certificate and key under `apache/cert/` (both are gitignored, so drop your own `.crt`/`.key` in and point `SSLCertificateFile` / `SSLCertificateKeyFile` at them). The config is currently using a Tailscale hostname because that's what it was last used with; change it to whatever your machine is actually called.

## Known limitations


- Metadata lives in a plain JSON file, not a real database. Fine at this scale. Can move to a PostgreSQL or a Firebase or whathaveyou if you want actual record lookup and auth.
-`upload_files` trusts the client's filename for both the on-disk path and the metadata key. Two uploads with the same filename will overwrite each other on disk.
- The `threading.Lock` is per-process only. If Apache ever spawned multiple WSGI workers, they each get their own lock and the JSON writes could interleave again.
