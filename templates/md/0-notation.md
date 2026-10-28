{%- set name = feed_url | split(pat = "/") | last -%}
{%- set parts = load_data(path = "content/chapters/" ~ name, format = "plain") | split(pat = "+++") -%}
{{ parts[2:] | join(sep = "+++") | trim }}
