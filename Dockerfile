FROM richarvey/nginx-php-fpm:3.1.6

# Copy application files
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Install dependencies using composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# PHP/Nginx configuration
# WEBROOT tells the richarvey image to serve Laravel from /public
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV SKIP_COMPOSER 1
ENV APP_ENV production
ENV APP_DEBUG false

# Set permissions for storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Restore nginx config — routes all requests to index.php (try_files)
# This is safe now because render-deploy.sh always calls exec /start.sh,
# so php-fpm IS running on 127.0.0.1:9000 when nginx connects.
COPY conf/nginx/nginx-site.conf /etc/nginx/sites-available/default.conf

# Use ENTRYPOINT — our script runs artisan commands then hands off to /start.sh
RUN chmod +x /var/www/html/render-deploy.sh
ENTRYPOINT ["/var/www/html/render-deploy.sh"]

# Expose port 80
EXPOSE 80