SHELL              := /bin/bash
ACTIVATE           := .venv/bin/activate
PYTHON_VERSION     := $(shell which python3)
REQUIREMENTS_FILE  := $(shell find . -type f -name "requirements.txt")

create_venv:
	@if [ -z "${PYTHON_VERSION}" ]; then \
		echo "Python3 is not installed. Install it using 'brew install python'"; \
		exit 1; \
	fi
	@if [ -z "${REQUIREMENTS_FILE}" ]; then \
		echo "No requirements.txt file found. Please create one."; \
		exit 1; \
	fi

	@if [ ! -d ".venv" ]; then \
		echo "Creating virtual environment..."; \
		python3 -m venv .venv; \
		echo "Virtual environment created."; \
	fi

	@if [ -f "${ACTIVATE}" ]; then \
		echo "Activating virtual environment and installing requirements..."; \
		sleep 1; \
		. ${ACTIVATE} && pip install -r ${REQUIREMENTS_FILE} && \
		echo "Requirements have been installed in the environment."; \
	else \
		echo "Virtual environment not found or activation script missing."; \
		exit 1; \
	fi