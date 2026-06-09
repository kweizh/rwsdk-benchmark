import { BoardClient } from "./BoardClient.js";

interface BoardPageProps {
  boardId: string;
}

export const BoardPage: React.FC<BoardPageProps> = ({ boardId }) => {
  return <BoardClient boardId={boardId} />;
};
