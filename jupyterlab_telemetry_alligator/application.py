from .handlers import RouteHandler
from jupyter_server.extension.application import ExtensionApp
from traitlets import Unicode, Bool, List
import pathlib
import os
import re
import pprint

class JupyterLabTelemetryAlligatorApp(ExtensionApp):

    name = "jupyterlab_telemetry_alligator"

    telemetry_path = Unicode("").tag(config=True)
    telemetry = Bool(None, allow_none=True).tag(config=True)

    # def initialize_settings(self):

    #     try:
    #         def pre_save_hook(model, **kwargs):
    #             pprint.pprint(model)

    #         self.settings['contents_manager'].register_pre_save_hook(pre_save_hook)

    #         def post_save_hook(model, os_path, contents_manager, **kwargs):
    #             pprint.pprint(os_path)
    #             pprint.pprint(model)

    #         self.settings['contents_manager'].register_post_save_hook(post_save_hook)

    #     except Exception as e:
    #         self.log.error(str(e))

    def initialize_handlers(self):
        self.handlers.extend([("/jupyterlab-telemetry-alligator/(.*)", RouteHandler)])

