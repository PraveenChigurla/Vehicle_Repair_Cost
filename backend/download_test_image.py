import requests
import cv2
import numpy as np

# We'll download an image from a known repo containing car damage images
url = "https://raw.githubusercontent.com/OlafenwaMoses/ImageAI/master/data-images/1.jpg"
response = requests.get(url)
with open("test_image.jpg", "wb") as f:
    f.write(response.content)

print("Downloaded test_image.jpg")
