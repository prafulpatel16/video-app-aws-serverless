document.getElementById("uploadForm").onsubmit = async function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("videoFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file before uploading.");
        return;
    }

    try {
        const response = await fetch("https://e1ji8asbxb.execute-api.us-east-1.amazonaws.com/dev/upload", {
            method: "POST",
            body: file,
            headers: {
                "Content-Type": file.type,
                "X-File-Name": file.name
            },
        });

        if (response.ok) {
            const result = await response.json();
            alert("File uploaded successfully!");
        } else {
            const errorText = await response.text();
            console.error("Upload error:", errorText);
            alert(`Upload failed: ${errorText}`);
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("An error occurred during file upload.");
    }
};


async function fetchVideos() {
    try {
        const response = await fetch("https://e1ji8asbxb.execute-api.us-east-1.amazonaws.com/dev/fetch");

        if (response.ok) {
            const videos = await response.json();
            const videoList = document.getElementById("videoList");

            if (videos.length === 0) {
                videoList.innerHTML = "<p>No videos available.</p>";
                return;
            }

            videoList.innerHTML = videos
                .map(
                    (video) =>
                        `<div>
                            <video controls width="480">
                                <source src="${video.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <p>${video.title || "Untitled Video"}</p>
                        </div>`
                )
                .join("");
        } else {
            console.error("Fetch error:", await response.text());
            alert("Error fetching videos.");
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("An error occurred while fetching videos.");
    }
}

fetchVideos();
