document.getElementById("uploadForm").onsubmit = async function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("videoFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a video file before uploading.");
        return;
    }

    try {
        const response = await fetch("https://e1ji8asbxb.execute-api.us-east-1.amazonaws.com/dev/upload", {
            method: "POST",
            body: file,
            headers: {
                "Content-Type": file.type,
                "X-File-Name": file.name,
            },
        });

        if (response.ok) {
            alert("Video uploaded successfully!");
            fileInput.value = "";
            fetchVideos();
        } else {
            const errorText = await response.text();
            console.error("Error uploading video:", errorText);
            alert(`Error: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("An error occurred while uploading the video.");
    }
};

async function fetchVideos() {
    try {
        const response = await fetch("https://e1ji8asbxb.execute-api.us-east-1.amazonaws.com/dev/fetch");

        if (response.ok) {
            const videos = await response.json();
            const videoList = document.getElementById("videoList");
            const videoPlayer = document.getElementById("videoPlayer");

            if (videos.length === 0) {
                videoList.innerHTML = "<p>No videos available.</p>";
                return;
            }

            videoList.innerHTML = videos
                .map((video, index) => `
                    <div class="video-item" onclick="playVideo('${video.url}')">
                        <span class="video-title">${index + 1}. ${video.title || "Untitled Video"}</span>
                    </div>
                `)
                .join("");

            // Autoplay the first video in the list
            if (videos[0]) {
                playVideo(videos[0].url);
            }
        } else {
            const errorText = await response.text();
            console.error("Fetch error:", errorText);
            alert(`Error fetching videos: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("An error occurred while fetching videos.");
    }
}

function playVideo(url) {
    const videoPlayer = document.getElementById("videoPlayer");
    videoPlayer.src = url;
    videoPlayer.play();
}

// Fetch and display videos on page load
fetchVideos();
