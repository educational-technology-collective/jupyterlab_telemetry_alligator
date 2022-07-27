from ._version import __version__
from .application import JupyterLabTelemetryAlligatorApp
import json
from pathlib import Path

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]

def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_telemetry_alligator",
        "app": JupyterLabTelemetryAlligatorApp
    }]

load_jupyter_server_extension = JupyterLabTelemetryAlligatorApp.load_classic_server_extension
