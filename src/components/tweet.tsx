import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useState } from "react";
import { styled } from "styled-components";

import { auth, db, storage } from "../firebase";
import type { ITweet } from "./timeline";

const MAX_FILE_SIZE = 1 * 1024 * 1024;

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
`;

const Column = styled.div`
  &:last-child {
    place-self: start end;
  }
`;

const Photo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 15px;
`;

const EditPhotoLabel = styled.label`
  display: block;
  width: fit-content;
  cursor: pointer;
  border: 2px dashed #1d9bf0;
  border-radius: 17px;
  padding: 3px;
  transition:
    filter 0.2s ease,
    transform 0.2s ease;
  &:hover {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }
  &:active {
    filter: brightness(1.05);
    transform: translateY(0);
  }
`;

const EditPhotoInput = styled.input`
  display: none;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 15px;
`;

const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
`;

const EditTextArea = styled.textarea`
  margin: 10px 0px;
  width: 100%;
  min-height: 100px;
  resize: vertical;
  border: 1px solid #1d9bf0;
  border-radius: 10px;
  background-color: black;
  color: white;
  padding: 10px;
  font-size: 16px;
  font-family: inherit;
  &:focus {
    outline: none;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $bgColor: string }>`
  background-color: ${(props) => props.$bgColor};
  color: white;
  font-weight: 600;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Tweet = ({ username, photo, tweet, userId, id }: ITweet) => {
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTweet, setEditedTweet] = useState(tweet);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedPhotoFile, setEditedPhotoFile] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState(photo || "");

  const onEdit = () => {
    setEditedTweet(tweet);
    setEditedPhotoFile(null);
    setPreviewPhoto(photo || "");
    setIsEditing(true);
  };

  const onCancel = () => {
    setEditedTweet(tweet);
    setEditedPhotoFile(null);
    setPreviewPhoto(photo || "");
    setIsEditing(false);
  };

  const onEditedTweetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTweet(e.target.value);
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || files.length !== 1) return;
    const selectedFile = files[0];
    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("File size must be 1MB or less.");
      e.target.value = "";
      return;
    }
    setEditedPhotoFile(selectedFile);
    setPreviewPhoto(URL.createObjectURL(selectedFile));
  };

  const onUpdate = async () => {
    const trimmedTweet = editedTweet.trim();
    if (
      user?.uid !== userId ||
      isUpdating ||
      trimmedTweet === "" ||
      trimmedTweet.length > 180
    )
      return;
    setIsUpdating(true);
    try {
      const updatePayload: { tweet: string; photo?: string } = {
        tweet: trimmedTweet,
      };
      if (editedPhotoFile) {
        if (editedPhotoFile.size > MAX_FILE_SIZE) {
          alert("File size must be 1MB or less.");
          return;
        }
        const locationRef = ref(storage, `tweets/${user.uid}/${id}`);
        const result = await uploadBytes(locationRef, editedPhotoFile);
        const url = await getDownloadURL(result.ref);
        updatePayload.photo = url;
      }
      await updateDoc(doc(db, "tweets", id), updatePayload);
      setEditedPhotoFile(null);
      setIsEditing(false);
    } catch (e) {
      console.log(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const onDelete = async () => {
    const ok = confirm("Are you sure you want to delete this tweet?");
    if (!ok || user?.uid !== userId) return;
    try {
      await deleteDoc(doc(db, "tweets", id));
      if (photo) {
        const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
        await deleteObject(photoRef);
      }
    } catch (e) {
      console.log(e);
    } finally {
      //
    }
  };

  return (
    <Wrapper>
      <Column>
        <Username>{username}</Username>
        {isEditing ? (
          <EditTextArea
            value={editedTweet}
            onChange={onEditedTweetChange}
            maxLength={180}
          />
        ) : (
          <Payload>{tweet}</Payload>
        )}
        {user?.uid === userId ? (
          <Actions>
            {isEditing ? (
              <>
                <ActionButton
                  $bgColor="#1d9bf0"
                  onClick={onUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </ActionButton>
                <ActionButton
                  $bgColor="gray"
                  onClick={onCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton $bgColor="#1d9bf0" onClick={onEdit}>
                  Edit
                </ActionButton>
                <ActionButton $bgColor="tomato" onClick={onDelete}>
                  Delete
                </ActionButton>
              </>
            )}
          </Actions>
        ) : null}
      </Column>
      <Column>
        {isEditing && user?.uid === userId && previewPhoto ? (
          <>
            <EditPhotoLabel htmlFor={`edit-photo-${id}`}>
              <Photo src={previewPhoto} />
            </EditPhotoLabel>
            <EditPhotoInput
              id={`edit-photo-${id}`}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
            />
          </>
        ) : photo ? (
          <Photo src={photo} />
        ) : null}
      </Column>
    </Wrapper>
  );
};

export default Tweet;
