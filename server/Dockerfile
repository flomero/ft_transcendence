# Use the official Python image from the Docker Hub (full image, not slim)
FROM python:3.11

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    bash-completion \
    vim \
    less \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Download Django bash-completion script
RUN curl -o /etc/bash_completion.d/django_bash_completion \
    https://raw.githubusercontent.com/django/django/main/extras/django_bash_completion

# Install Oh My Bash for a better shell prompt
RUN bash -c "$(curl -fsSL https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh)" || true
RUN sed -i 's/OSH_THEME=.*/OSH_THEME="agnoster"/' ~/.bashrc

# Add Django-related aliases and shortcuts
RUN echo "alias python='python3'" >> ~/.bashrc \
    && echo "alias djrun='python manage.py runserver 0.0.0.0:8000'" >> ~/.bashrc \
    && echo "alias djmig='python manage.py makemigrations && python manage.py migrate'" >> ~/.bashrc

# Ensure bash-completion is sourced
RUN echo 'source /etc/bash_completion' >> ~/.bashrc
RUN echo "source ~/.bashrc" >> ~/.bash_profile

# Copy the requirements file
COPY server/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the Django project
COPY server /app/

# Expose the port the app runs on
EXPOSE 8000

# Run the Django development server
CMD ["uvicorn", "ft_transcendence.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-include", "*.html"]
