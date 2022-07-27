#  This file should be saved into one of the config directories provided by `jupyter lab --path`.

#  The url of the S3 bucket, which will comprise the first component of the bucket_url.
c.JupyterLabTelemetryAlligatorApp.efs_path = "/logs/alligator/telemetry"

#  Telemetry can be turned on by either setting telemetry to True or by touching the .telemetry file in the Lab home directory.
c.JupyterLabTelemetryAlligatorApp.telemetry = True
