import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [fileInput, setFileInput] = useState(null);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: `${new Date().getHours()}:${new Date().getMinutes()}`,
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFileInput(selectedFile);
  };

  const sendFile = async () => {
    if (fileInput) {
      const formData = new FormData();
      formData.append("file", fileInput);

      try {
        const response = await fetch("http://localhost:3001/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const fileData = await response.json();
          const messageData = {
            room: room,
            author: username,
            file: fileData._id, // Assuming the server sends the file ID
            contentType: fileInput.type,
            time: `${new Date().getHours()}:${new Date().getMinutes()}`,
          };

          await socket.emit("send_message", messageData);
          setMessageList((list) => [...list, messageData]);
        } else {
          console.error("File upload failed");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }

      setFileInput(null);
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => (
            <div
              key={index}
              className="message"
              id={username === messageContent.author ? "you" : "other"}
            >
              <div>
                <div className="message-content">
                  {messageContent.message ? (
                    <p>{messageContent.message}</p>
                  ) : (
                    <a
                      href={`http://localhost:3001/download/${messageContent.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download File
                    </a>
                  )}
                </div>
                <div className="message-meta">
                  <p id="time">{messageContent.time}</p>
                  <p id="author">{messageContent.author}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyPress={(event) => event.key === "Enter" && sendMessage()}
        />
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt" // Define accepted file types
          onChange={handleFileChange}
        />
        <button onClick={sendMessage}>&#9658;</button>
        <button onClick={sendFile}>Send File</button>
      </div>
    </div>
  );
}

export default Chat;
