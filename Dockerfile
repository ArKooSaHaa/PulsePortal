FROM richarvey/nginx-php-fpm:3.1.6

# Copy application files
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Install dependencies using composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# PHP/Nginx configuration
ENV WEBROOT /var/www/html/public
ENV PHP_ERRORS_STDERR 1
ENV SKIP_COMPOSER 1
ENV APP_ENV production
ENV APP_DEBUG false
ENV RUN_SCRIPTS 1 

# Set permissions for storage and bootstrap/cache
RUN chown -R nginx:nginx /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Move your deploy script into the special folder so the image runs it automatically
RUN mkdir -p /var/www/html/scripts
RUN mv /var/www/html/render-deploy.sh /var/www/html/scripts/00-deploy.sh
RUN chmod +x /var/www/html/scripts/00-deploy.sh

# Expose port 80
EXPOSE 80