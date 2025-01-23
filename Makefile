SHELL              := /bin/bash
ACTIVATE           := $(shell find . -type f -name "activate")
VIRTUAL_ENV        := $(shell which virtualenv)
PYTHON_VERSION     := $(shell which python3)
REQUIREMENTS_FILE  := $(shell find . -type f -name "requirements.txt")

create_venv:
	@if [ -z "${PYTHON_VERSION}" ]; then \
		echo "Python3 is not installed. Install: 'brew install python'"; \
	elif [ -z "${VIRTUAL_ENV}" ]; then \
		echo "Virtualenv is not installed. Install: 'python -m pip install --user virtualenv'"; \
	elif [ -z "${REQUIREMENTS_FILE}" ]; then \
		echo "No requirements.txt file found, please create one"; \
	fi

	@if [ ! -d ".venv" ]; then \
		virtualenv .venv; \
	fi
	@if [ ! -z "${REQUIREMENTS_FILE}" ]; then \
		. ${ACTIVATE} && pip install -r ${REQUIREMENTS_FILE} && \
		echo "Requirements have been installed in env"; \
	fi
