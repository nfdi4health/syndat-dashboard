# Define the base image
FROM python:3.9

# Create a folder and copy the folder structure from local
RUN mkdir -p /api
RUN mkdir -p /datasets
RUN mkdir -p /credits

COPY /api /api
COPY /datasets /datasets
COPY /credits /credits

# Install API requirements
COPY requirements.txt /tmp/
RUN pip install --requirement /tmp/requirements.txt

EXPOSE 80

# API entry point
CMD ["uvicorn", "api.routes:app", "--host", "0.0.0.0", "--port", "80"]






