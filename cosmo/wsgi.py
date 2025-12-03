"""All requests are routed through"""
from typing import Any, Callable
import os


# relative to cosmo.conf/DocumentRoot
ROOT = "."

def application(environ: dict, start_response: Callable[[str, list[Any]], Any]) -> list[bytes]:
    status = '200 OK'
    headers = [('Content-Type', 'text/html; charset=utf-8'), ('env', str(environ))]
    meth = environ['REQUEST_METHOD'].lower()
    path = environ['REQUEST_URI'].lower()

    resource = get_path_to_resource(path)
    start_response(status, headers)
    return [open(resource, 'rb').read()]

def get_path_to_resource(path: str) -> str:
    path = path.strip('/')
    match path:
        case '' | '/':
            return ROOT + '/static/index.html'
        case default:
            return ROOT + '/static/index.html'
