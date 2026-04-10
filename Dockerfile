FROM richarvey/nginx-php-fpm:3.1.6

# Copy application files
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Install dependencies using composer
# We set COMPOSER_ALLOW_SUPERUSER=1 to allow running as root in Docker
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# PHP/Nginx configuration overrides
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV SKIP_COMPOSER 1
ENV APP_ENV production
ENV APP_DEBUG false

# Set permissions for storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expose port 80
EXPOSE 80

# Use our custom deployment script
RUN chmod +x /var/www/html/render-deploy.sh
ENTRYPOINT ["/var/www/html/render-deploy.sh"]
