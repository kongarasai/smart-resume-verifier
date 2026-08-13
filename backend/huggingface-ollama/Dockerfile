FROM ollama/ollama:latest

# HuggingFace Spaces requires port 7860
ENV OLLAMA_HOST=0.0.0.0:7860
ENV OLLAMA_ORIGINS=*
ENV OLLAMA_MODELS=/root/.ollama/models

EXPOSE 7860

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
