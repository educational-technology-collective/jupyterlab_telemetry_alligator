import asyncio
from requests import Session, Request
from ._version import _fetchVersion
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
import os, json, concurrent, tornado
import urllib.request
import time
from tornado.ioloop import IOLoop
import uuid
from datetime import datetime
import pathlib

class RouteHandler(ExtensionHandlerMixin, JupyterHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self, resource):        
   
        try:
            self.set_header('Content-Type', 'application/json')

            if resource == 'jupyterhub_user':
                jupyterhub_user = os.getenv('JUPYTERHUB_USER') if os.getenv('JUPYTERHUB_USER') is not None else 'UNDEFINED'
                self.finish(json.dumps(jupyterhub_user))
            
            elif resource == 'telemetry':
                self.finish(json.dumps({'telemetry' : self.extensionapp.telemetry}))

            elif resource == 'environ':
                self.finish(json.dumps({k:v for k, v in os.environ.items()}))

            elif resource == 'version':
                self.finish(json.dumps(_fetchVersion()))

            else:
                self.set_status(404)
                self.finish("")

        except Exception as e:
            self.log.error(str(e))
            self.set_status(500)
            self.finish(json.dumps(str(e)))

    @tornado.web.authenticated
    async def post(self, resource):
        try:

            if resource == 'telemetry' and self.extensionapp.telemetry:
                
                data = self.request.body

                file_name = f'{str(uuid.uuid4())}_{int(time.time() * 1000)}.json'
                
                with open(pathlib.Path().joinpath(
                    self.extensionapp.telemetry_path, 
                    os.getenv('ETC_SESSION_UUID'),
                    file_name), 'wb') as f:
                    f.write(data)

                self.finish(json.dumps(data.decode("utf-8")))

            else:
                self.set_status(404)

        except Exception as e:
            self.log.error(str(e))
            self.set_status(500)
            self.finish(json.dumps(str(e)))


        
