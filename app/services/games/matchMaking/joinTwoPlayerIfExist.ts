import { matchMakingManager } from "./join/joinMatchMakingHandler";
import { createVanillaMatch } from "./createVanillaMatch";
const joinTwoPlayerIfExist = async (): Promise<void> => {
  if (matchMakingManager.memberSize >= 2) {
    const lastMembers = matchMakingManager.getLastTwoMember();
    const matchId = createVanillaMatch(
      lastMembers[0].memberId,
      lastMembers[1].memberId,
    );
    sendMatchIdToMembers(
      matchId,
      lastMembers[0].memberId,
      lastMembers[1].memberId,
    );
    matchMakingManager.closeSocketConnectionOfLastTwoMembers();
    matchMakingManager.removeLastTwoMembers();
  }
};

const sendMatchIdToMembers = (
  matchId: string,
  firstMember: string,
  secondMember: string,
) => {
  matchMakingManager.sendMessageToMember(
    firstMember,
    JSON.stringify({ type: "matchFound", matchId: matchId }),
  );
  matchMakingManager.sendMessageToMember(
    secondMember,
    JSON.stringify({ type: "matchFound", matchId: matchId }),
  );
};

export default joinTwoPlayerIfExist;
