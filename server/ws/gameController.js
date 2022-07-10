/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
/* eslint-disable no-fallthrough */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
const { Op } = require('sequelize');
const {
  Questions, Answers, Turn, UserTurn, UserGames, Game,
} = require('../db/models');
const { ATTACK, ANSWER, DRAW, LOSS, WIN, GAMEOVER, GAMEWIN } = require('./types');
const generalInformation = require('./generalInformation');

async function attack(subtype, rooms, params) {
  const {
    room, difficulty, answeredQuestions, turnID,
  } = params;

  // Search for a question and created a new turn
  const question = await Questions.findOne({ where: { id: { [Op.notIn]: answeredQuestions }, difficulty } });
  const turn = await Turn.update({ question_id: question.id, difficulty }, { where: { id: turnID } });

  // Received response options for a question and prepare them for submission
  const requestAnswers = await Answers.findAll({ where: { question_id: question.id } });
  const answers = requestAnswers.map((el) => ({ id: el.id, answer: el.answer }));

  // Message formation
  const message = {
    type: subtype,
    params: {
      question: question.question,
      questionID: question.id,
      answers,
      turnID: turn.id,
    },
  };

  // Sending a message around the room
  generalInformation(subtype, rooms, room, message);
}

async function responseAnswers(rooms, room, oldturn) {
  // Checking how many players have already answered on the current turn
  const answers = await UserTurn.findAll({ where: { turn_id: oldturn.id } });

  // If two players answered...
  if (answers.length === 2) {
    const { game_id, difficulty } = oldturn;

    // Create new TURN
    const turn = await Turn.create({ game_id });
    const turnID = turn.id;

    // Grouping userID of winners and losers
    const trueAnsweredUserID = answers.filter((el) => (el.isTrue)).map((el) => el.user_id);
    const falseAnsweredUserID = answers.filter((el) => (!el.isTrue)).map((el) => el.user_id);

    // DAMAGE variable declaration
    const damage = difficulty * 10;

    // Type and message for generalinformation variable declaration
    let infotypeLoser;
    let infotypeWinner;
    let message = {};

    // ID variable declaration
    let winnerID;
    let loserID;

    // HP variable declaration
    let hpLoser;
    let hpWinner;

    // State of the players in the current turn
    let stateLoserInTurn;
    let stateWinnerInTurn;

    switch (true) {
      // If both players answered correctly or both incorrectly
      case trueAnsweredUserID.length === 2 || falseAnsweredUserID.length === 2:
        message = { type: DRAW, params: { turnID } };
        generalInformation(DRAW, rooms, room, message);
        break;

      // If only one player answered correctly
      case trueAnsweredUserID.length === 1:
        // Dstructuring Winner and Loser ID
        [loserID] = falseAnsweredUserID;
        [winnerID] = trueAnsweredUserID;
        console.log('loserID winnerID', loserID, winnerID);

        // Winner state and update the loser state in the database
        stateWinnerInTurn = await UserGames.findOne({ where: { game_id, user_id: winnerID } });
        stateLoserInTurn = await UserGames.decrement({ hp: damage }, { where: { game_id, user_id: loserID }, returning: true, plain: true });
        hpLoser = stateLoserInTurn.flat()[0].hp;
        hpWinner = stateWinnerInTurn.hp;

        // Checking the loser's HP and assigning death if less than 0
        if (hpLoser <= 0) {
          hpLoser = 0;
          infotypeLoser = GAMEOVER;
          infotypeWinner = GAMEWIN;
          try { await Game.update({ winner_id: winnerID }, { where: { id: game_id } }); } catch (err) { console.error('error game update winner ---->', err); }
        } else {
          infotypeLoser = LOSS;
          infotypeWinner = WIN;
        }

        // Message to the loser
        message = { type: infotypeLoser, params: { turnID, hp: hpLoser, hpEnemy: hpWinner, damage } };
        generalInformation(infotypeWinner, rooms, room, message, loserID);

        // Message to the winner
        message = { type: infotypeWinner, params: { turnID, hp: hpWinner, hpEnemy: hpLoser, damage } };
        generalInformation(infotypeWinner, rooms, room, message, winnerID);
        break;

      default:
        console.log('check answerd error');
        break;
    }
  }
}

async function checkAnswer(rooms, params) {
  const {
    room, userID, answerID, turnID,
  } = params;
  const turn = await Turn.findOne({ where: { id: turnID } });

  if (answerID > 0) {
    const answer = await Answers.findOne({ where: { id: answerID } });

    if (answer.isTrue) { await UserTurn.create({ user_id: userID, turn_id: turnID, isTrue: true }); }
    if (!answer.isTrue) { await UserTurn.create({ user_id: userID, turn_id: turnID, isTrue: false }); }
  } else { await UserTurn.create({ user_id: userID, turn_id: turnID, isTrue: false }); }

  responseAnswers(rooms, room, turn);
}

function gameController(rooms, subtype, params) {
  switch (subtype) {
    case ATTACK:
      attack(subtype, rooms, params);
      break;
    case ANSWER:
      checkAnswer(rooms, params);
    default:
      console.log('no subtype');
  }
}

module.exports = { gameController, generalInformation };
