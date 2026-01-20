# Use official Apache HTTPD image
FROM httpd:latest

# Optional: copy a custom Apache config if you have one
COPY httpd.conf /usr/local/apache2/conf/httpd.conf

# Expose port 80 (default for Apache)
EXPOSE 80

# The container will serve whatever is mounted at /usr/local/apache2/htdocs/
# No CMD needed because the base image already starts Apache
