resource "aws_s3_object" "data_prefix" {
  bucket = aws_s3_bucket.site.id
  key    = "data/"
  content = ""
}

resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.site.id
  key          = "index.html"
  content_type = "text/html"
  content      = <<HTML
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>cycling-mne</title>
  </head>
  <body>
    <h1>cycling-mne web site placeholder</h1>
    <p>Deploy your React app to this bucket. Static data goes under /data.</p>
  </body>
</html>
HTML
}


