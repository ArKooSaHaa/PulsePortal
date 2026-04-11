FROM richarvey/nginx-php-fpm:3.1.6

# Copy application files
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Install dependencies using composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# PHP/Nginx configuration
# WEBROOT tells the richarvey image where to serve from — no custom nginx config needed
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV SKIP_COMPOSER 1
ENV APP_ENV production
ENV APP_DEBUG false

# Set permissions for storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Use ENTRYPOINT with our script (which ends by calling /start.sh)
RUN chmod +x /var/www/html/render-deploy.sh
ENTRYPOINT ["/var/www/html/render-deploy.sh"]

# Expose port 80
EXPOSE 80
