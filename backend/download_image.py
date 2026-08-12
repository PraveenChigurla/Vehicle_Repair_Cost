import requests

urls = [
    "https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/bus.jpg",
    "https://raw.githubusercontent.com/OlafenwaMoses/ImageAI/master/data-images/1.jpg"
]

for url in urls:
    print(f"Trying {url}")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            with open("test_image.jpg", "wb") as f:
                f.write(response.content)
            print("Downloaded successfully!")
            break
    except Exception as e:
        print(e)
