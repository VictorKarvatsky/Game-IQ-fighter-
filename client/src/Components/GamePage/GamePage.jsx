import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSound from 'use-sound';
import styles from './GamePage.module.css';
import maleChar from '../Player/img/male-mage.png';
import femaleMage from '../Player/img/female-model-new.png';
import { useWsContext } from '../Context/Context';
import { messageFind } from '../../Redux/Actions/wsAction';
/* eslint-disable max-len */
import Player from '../Player/Player';
import { femaleMageModel, maleMageModel } from '../Player/playersModels';
import Spinner from '../Spinner/Spinner';
import { JOIN_ROOM } from '../../Redux/Types/types';
import HealthBar from '../HealthBar/HealthBar';
import QuizModal from '../QuizModal/QuizModal';
import GameNavbar from '../Navbar/GameNavBar';
import GameOverModal from '../GameOverModal/GameOverModal';

function GamePage() {
  const body = document.querySelector('body');
  body.style.backgroundImage = 'none';

  const {
    modal, isDraw, setIsDraw, fireball, enemyFireball, leftDamage, rightDamage, ws, firstPlayerHp, secondPlayerHp, readyState, playerDamage,
  } = useWsContext();

  const spinner = useSelector((state) => state.spinner);
  const player = useSelector((state) => state.player);
  const dispatch = useDispatch();

  const [firstPlayer, setFirstPlayer] = useState({ cursor: '', active: 'false', nameColor: false });
  const [secondPlayer, setSecondPlayer] = useState({ cursor: '', active: 'false', nameColor: true });

  function checkTurn() {
    if (player.position === 'left' && player.turn) {
      setFirstPlayer({
        cursor: "url('../../img/cursor-default.png'), auto",
        active: false,
        nameColor: false,
      });
      setSecondPlayer({
        cursor: "url('../../img/sword-attack-icon.png'), auto",
        active: true,
        nameColor: true,
      });
    } else if (player.position === 'left' && !player.turn) {
      setFirstPlayer({
        cursor: "url('../../img/cursor-default.png'), auto",
        active: false,
        nameColor: true,
      });
      setSecondPlayer({
        cursor: "url('../../img/sword-attack-icon.png'), auto",
        active: false,
        nameColor: false,
      });
    } else if (player.position === 'right' && !player.turn) {
      setFirstPlayer({
        cursor: "url('../../img/sword-attack-icon.png'), auto",
        active: false,
        nameColor: false,
      });
      setSecondPlayer({
        cursor: "url('../../img/cursor-default.png'), auto",
        active: false,
        nameColor: true,
      });
    } else if (player.position === 'right' && player.turn) {
      setFirstPlayer({
        cursor: "url('../../img/sword-attack-icon.png'), auto",
        active: true,
        nameColor: true,
      });
      setSecondPlayer({
        cursor: "url('../../img/cursor-default.png'), auto",
        active: false,
        nameColor: false,
      });
    } else if (player.turn === false) {
      setFirstPlayer({
        cursor: "url('../../img/stop-cursor.svg'), auto",
        active: false,
      });
      setSecondPlayer({
        cursor: "url('../../img/stop-cursor.svg'), auto",
        active: false,
      });
    }
  }

  useEffect(() => {
    if (ws.readyState === 1) {
      dispatch(messageFind(ws));
      console.log(ws);
    }
  }, [readyState]);

  useEffect(() => {
    checkTurn();
  }, [player.turn]);

  useEffect(() => {
    setTimeout(() => {
      setIsDraw(false);
    }, 3000);
  }, [isDraw]);

  return (
    <div className={styles.gameContainer}>
      <GameNavbar />
      {spinner !== JOIN_ROOM
        ? <Spinner />
        : (
          <div>
            <video className={styles.videoBackground} autoPlay loop muted src="https://bnetcmsus-a.akamaihd.net/cms/template_resource/4TBVITQDP0AW1650382032717.mp4" />
            <div className={styles['game-page-container']}>
              <div className={styles['char-block']}>
                {firstPlayer?.nameColor ? <h3 className={styles.nikNameDef}>{player.firstName}</h3> : <h3 className={styles.nikNameAttack}>{player.firstName}</h3> }
                <Player url={femaleMage} model={femaleMageModel} position="left" cursor={firstPlayer} width={383} imgWidth={574} />
                <div className={styles.firstChar} />
                <div>
                  <HealthBar hp={firstPlayerHp} mt-3 />
                  {leftDamage && (
                    <div className={styles.hpbox}>
                      <span className={styles.hp}>
                        -
                        {playerDamage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {fireball && <div className={styles.flame} />}
              {enemyFireball && <div className={styles['flame-reverse']} />}

              <p className={isDraw ? styles['draw-message'] : styles.hidden}>АТАКА ПАРИРОВАНА</p>

              <div className={styles['char-block']}>
                {secondPlayer?.nameColor ? <h3 className={styles.nikNameDef}>{player.secondName}</h3> : <h3 className={styles.nikNameAttack}>{player.secondName}</h3> }
                <Player url={maleChar} model={maleMageModel} position="right" cursor={secondPlayer} width={600} imgWidth={820} />
                <div>
                  <HealthBar hp={secondPlayerHp} mt-3 />
                  {rightDamage && (
                    <div className={styles.hpbox}>
                      <span className={styles.hp}>
                        -
                        {playerDamage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      {modal ? <QuizModal /> : null }
      <GameOverModal />
    </div>
  );
}

export default GamePage;
