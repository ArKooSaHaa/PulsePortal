FROM richarvey/nginx-php-fpm:3.1.6

# Copy application files
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Install dependencies using composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# PHP/Nginx configuration overrides
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV SKIP_COMPOSER 1
ENV APP_ENV production
ENV APP_DEBUG false

# --- THE FIX: Override the default Nginx site config with our Laravel-aware one ---
COPY conf/nginx/nginx-site.conf /etc/nginx/sites-available/default.conf

# Set permissions for storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy deployment script to the image's startup scripts folder
RUN mkdir -p /var/www/html/scripts
COPY render-deploy.sh /var/www/html/scripts/run.sh
RUN chmod +x /var/www/html/scripts/run.sh

# Expose port 80
EXPOSE 80
