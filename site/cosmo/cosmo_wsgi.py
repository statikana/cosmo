# handles POST requests. idk how else to do this.

import logging
import json, time, threading, os

from urllib.parse import parse_qs, unquote, urlsplit
from multipart import parse_form_data, is_form_request, MultipartPart

from typing import Callable
from collections import deque

# lock file for accessing data.json, just in case.
data_lock = threading.Lock()


# .../site/cosmo
COSMO_ROOT = os.path.dirname(os.path.abspath(__file__))

def application(environ: dict, start_response: Callable) -> list[bytes]:
    split = urlsplit(environ['REQUEST_URI'])

    method = environ['REQUEST_METHOD'].lower()

    logging.info('got request: ' + method + ' ' + split.path)
    headers = [('Content-Type', 'text/html; charset=utf-8')]
    
    match split.path:
        case '/cosmo/upload':
            if method != 'post' or not is_form_request(environ):
                start_response('400 Bad Request', headers)
                return []
            
            start_response('200 OK', headers)
            return upload_files(environ)
        
        case '/cosmo/delete':
            if method != 'post':
                start_response('400 Bad Request', headers)
                return []
            
            start_response('200 OK', headers)
            return delete_files(environ)

        case default:
            start_response('500 Internal Error', headers)
            return []


def upload_files(environ: dict) -> list[bytes]:

    # write to /media
    forms, files = parse_form_data(environ)
    
    deque(map(lambda mp: mp.save_as(f'{COSMO_ROOT}/media/{mp.filename}'), files.getall('uploaded-files')))

    # update changes.json meta
    filenames = map(lambda mp: mp.filename, files.getall('uploaded-files'))
    with data_lock:
        with open(f'{COSMO_ROOT}/data.json', 'r') as file:
            if file.read(1):
                file.seek(0)
                file_json = json.load(file)
            else:
                file_json = dict()
        with open(f'{COSMO_ROOT}/data.json', 'w') as file:
            for filename in filenames:

                entry = {
                    'ip': environ.get('REMOTE_ADDR', 'unknown'),
                    'time': time.time(),
                    'size': os.path.getsize(f'{COSMO_ROOT}/media/{filename}')
                }

                file_json.update({filename: entry})

            file.write(json.dumps(file_json))
    return []


def delete_files(environ: dict) -> list[bytes]:
    query = parse_qs(environ['QUERY_STRING'])
    filenames = map(unquote, query.get('filenames', []))
    with data_lock:
        with open(f"{COSMO_ROOT}/data.json", "r+") as f:
            data = json.load(f)
            for filename in filenames:
                try:
                    os.remove(f'{COSMO_ROOT}/media/{filename}')
                except FileNotFoundError:
                    pass

                if filename in data:
                    del data[filename]
            f.seek(0)
            f.truncate()
            json.dump(data, f)
    return []
