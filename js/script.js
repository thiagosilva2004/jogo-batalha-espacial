(function(){
    // canvas
    var cnv = document.querySelector('canvas'); // canvas
    // contexto de rendenização
    var ctx = cnv.getContext('2d'); // contexto
    // alert(ctx);
 
    // RECURSOS DO JOGO ========================

    // arrays
    var sprites = [];   // imagens que fazem parte da animação
    var assetsToLoad = []; // dados que precisam carregados
    var missiles = [];
    var aliens = [];
    var messages = [];
    
    // variaveis úteis
    var alienFrequency = 100;
    var alienTimer = 0;
    var shoots = 0; // quantidade de tiros 
    var hits = 0; // acertos
    var acuracy = 0; // percentual de acertos sobre tiros
    var scoreWin = 35; // pontuaçao necessaria para ganhar o jogo
    var FIRE = 0;
    var EXPLOSION = 1;

    // sprites
    // cenario
    var background = new Sprite(0, 56, 400, 500, 0, 0); 
    sprites.push(background);

    // nave que controlamos
    var defender = new Sprite(0, 0, 30, 50, 185, 450);
    sprites.push(defender);

    // mensagem da tela inicial
    var startMessage = new ObjectsMessage(cnv.height / 2, "PRESSIONE ENTER", "#f00");
    messages.push(startMessage);

    // mensagem de pause
    var pausedMessage = new ObjectsMessage(cnv.height / 2, "PAUSADO", "#foo");
    pausedMessage.visible = false;
    messages.push(pausedMessage);

    // mensagem de game over
    var gameOverMessage = new ObjectsMessage(cnv.height / 2, "", "#f00");
    gameOverMessage.font = ("normal bold 18px emulogic");
    gameOverMessage.visible = false;
    messages.push(gameOverMessage);

    // placar
    var scoreMessage = new ObjectsMessage(10, "", "#0f0");
    scoreMessage.font = ("normal bold 12px emulogic");
    updateScore();
    messages.push(scoreMessage);

    // imagens
    var img = new Image();
    img.addEventListener('load', loadHandler, false);
    img.src = "image/img.png";
    assetsToLoad.push(img);
    // contador de recursos
    var loadedAssets = 0;

    // ações
    var mvLeft = mvRight = shoot = spaceIsDown = false;

    // estados do jogo
    var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
    var gameState = LOADING;

    // listeners
    document.addEventListener("keydown", event => teclaClicada(event)); // chama a função da tecla clicado
    document.addEventListener("keyup", event => teclaSoltada(event));   // chama a função da tecla é soltada
    
    function teclaClicada(event) {
        tecla = event.key; 
        switch(tecla){
            case 'ArrowLeft': 
                mvLeft = true;
                break;
            case 'ArrowRight':
                mvRight = true;
                break;
            case ' ':
                if(!spaceIsDown){
                    shoot = true;
                    spaceIsDown = true;
                }
                break;
        }
    }

    function teclaSoltada(event) {
        tecla = event.key;
        switch(tecla){
            case 'ArrowLeft':
                mvLeft = false;
                break;
            case 'ArrowRight':
                mvRight = false;
                break;
            case 'Enter':
                if(gameState != OVER){
                    if(gameState != PLAYING){
                        gameState = PLAYING;
                        startMessage.visible = false;
                        pausedMessage.visible = false;
                    }else{
                        gameState = PAUSED;
                        pausedMessage.visible = true;
                    }
                }
                break;
            case ' ':
                spaceIsDown = false;
                break;
        }
    }


    // versao antiga retitar caso não precise
    /*
    window.addEventListener('keydown', function(e){
        var key = e.keyCode;
        alert(key);
    }, false);*/

    // FUNÇÕES =================================

    function loadHandler() { // caregamento
        loadedAssets++;
        if(loadedAssets === assetsToLoad.length){ // verifica se todos os arquivos foram carregados
            img.removeEventListener('load', loadHandler, false);
            // inicia o jogo
            gameState = PAUSED;
        }
    }

    function loop(){
        requestAnimationFrame(loop, cnv);   
        // defini as ações com base no estado do jogo
        switch(gameState){
            case LOADING:
                console.log('loading...');
                break;
            case PLAYING:
                update();
                break;
            case OVER:
                endGame();
                break;
        }
        render();
    }

    function update() {
        // move para a esquerda
        if(mvLeft && !mvRight){
            defender.velocidadeEmX = -5;
        }
        // move para a direita
        if(mvRight && !mvLeft){
            defender.velocidadeEmX = 5;
        }
        // move a nave
        if(!mvLeft && ! mvRight){
            defender.velocidadeEmX = 0;
        }

        // dispara o canhão
        if(shoot){
            fireMissile();
            shoot = false;
        }

        // atualiza a posição
        defender.x = Math.max(0, Math.min(cnv.width - defender.width, defender.x + defender.velocidadeEmX));

        // atualiza a posição dos misseis
        for(var i in missiles){
            var missile = missiles[i];
            missile.y += missile.velocidadeEmY;

            if(missile.y < -missile.height){ // verifica se o missei chegou no fim
                removeObjects(missile, missiles);
                removeObjects(missile, sprites);
                updateScore();
                i--;
            }
        }

        // move os aliens
        for(var i in aliens){
            var alien = aliens[i];
            if(alien.state !== alien.EXPLODED){
                alien.y += alien.velocidadeEmY;
                if(alien.state === alien.CRAZY){
                    if(alien.x > cnv.width - alien.width || alien.x < 0){
                        alien.velocidadeEmX *= -1;
                    }
                    alien.x += alien.velocidadeEmX;
                }
            }

            // confere se algum alien chegou a terra
            if(alien.y > cnv.height + alien.height){
                gameState = OVER;
            }

            // confere se algum alien colidiu com a nave defender
            if(collide(alien, defender)){
                destroyAlien(alien);
                removeObjects(defender, sprites);
                gameState = OVER; 
            }

            // confere se algum alien foi destruido
            for(var k in missiles){
                var missile = missiles[k];
                if(collide(missile, alien) && alien.state !== alien.EXPLODED){
                    destroyAlien(alien);
                    hits++;
                    updateScore();

                    // confore se atingiu a quantidade de naves destruidas para ganhar o jogo
                    if(parseInt(hits) >= scoreWin){
                        gameState = OVER;
                        // destroi todos os aliens
                        for (indice in aliens){
                            alienIndice = aliens[indice];
                            destroyAlien(alienIndice);
                        }
                    }

                    removeObjects(missile, missiles);
                    removeObjects(missile, sprites);
                    k--;
                    i--;
                }
            }
        }

        // encremento do alienTimer
        alienTimer++;

        // criação do alien
        if(alienFrequency === alienTimer){
            makeAlien();
            alienTimer = 0;
            // ajuste na frenquencia de criação de alien
            if(alienFrequency > 2){
                alienFrequency--;
            }
        }
    }

    // criação dos mísseis
    function fireMissile() {
        var missile = new Sprite(136, 12, 8, 13, defender.centerX() - 4, defender.y - 13);
        missile.velocidadeEmY = -8;
        sprites.push(missile);
        missiles.push(missile);   
        shoots++;
        playSound(FIRE);
    }

    // criação de aliens
    function makeAlien(){
        // cria um valor aleatorio entre 0 e 7 => largura do canvas / largura do alien
        // dividi o canvas em 8 colunas para o posicionamento aleatorio do alien
        var alienPosition = (Math.floor(Math.random() * 8)) * 50;
        var alien = new Alien(30, 0, 50, 50, alienPosition, -50);
        alien.velocidadeEmY = 1;

        // otimização do alien
        if(Math.floor(Math.random() * 11) > 7){
            alien.state = alien.CRAZY;
            alien.velocidadeEmX = 2;
        }

        if(Math.floor(Math.random * 11) > 5){
            alien.velocidadeEmY = 2;
        }

        sprites.push(alien);
        aliens.push(alien);

    }

    // destroi alien
    function destroyAlien(alien){
        alien.state = alien.EXPLODED;
        alien.explode();
        playSound(EXPLOSION);
        setTimeout(function(){
            removeObjects(alien, aliens);
            removeObjects(alien, sprites);
        }, 600);
    }

    // remove os objetos inutes do jogo
    function removeObjects(objectsToRemove, array){
        var pos = array.indexOf(objectsToRemove); // pega a posição do objeto no array
        if(pos !== -1){ // verifica se o objeto existe
            array.splice(pos, 1); // remove o objeto do array
        }
    }

    // atualizacao do placar
    function updateScore(){
        // calculo de precisao
        if(shoots === 0){
            acuracy = 100;
        }else{
            acuracy = Math.floor((hits / shoots) * 100);
        }

        // ajuste no texto aproveitamento
        if(acuracy < 100){
            acuracy = acuracy.toString();
            if(acuracy.length < 2){
                acuracy = "  " + acuracy;
            }else{
                acuracy = " " + acuracy
            }
        }

        // ajuste no texto aproveitamento
        hits = hits.toString();
        if(hits.length < 2){
            hits = "0" + hits;
        }

        scoreMessage.text = "MORTES: " + hits + " - APROVEITAMENTO: " + acuracy + "%";
    }

    // função de game over
    function endGame() {
        if(parseInt(hits) < scoreWin){
            gameOverMessage.text = "A Terra foi destruida";
        }else{
            gameOverMessage.text = "A Terra foi salva";
            gameOverMessage.color = "#00f";
        }

        gameOverMessage.visible = true;
        setTimeout(function(){
            location.reload();
        }, 3000);
    }

    // efeitos sonoros
    function playSound(soundType){
        var sound = document.createElement("audio");
        if(soundType === EXPLOSION){
            sound.src = "sound/explosion.ogg";
        }else{
            sound.src = "sound/fire.ogg";
        }
        sound.addEventListener("canplaythrough", function() {
            sound.play();
        }, false);
    }

    function render() {
        ctx.clearRect(0,0, cnv.width, cnv.height); // limpa a tela
        // exibi os sprites
        if(sprites.length !== 0){ // verifica se precisa rendelizar sprites
            for(var i in sprites){ // rendeliza todos os sprites
                var spr = sprites[i];
                // desenha na tela
                ctx.drawImage(img, spr.sourceX, spr.sourceY, spr.width, spr.height, Math.floor(spr.x), Math.floor(spr.y), spr.width, spr.height);
            }
        }

        // exibi os textos
        if(messages.length != 0){ // verifica se precisa rendelizar as mensagens
            for(var i in messages){ // rendeliza todos os sprites
                var message = messages[i];
                if(message.visible){ // verificao para ver o estado de visibilidade
                    ctx.font = message.font;
                    ctx.fillStyle = message.color;
                    ctx.textBaseline = message.baseLine;
                    message.x = (cnv.width - ctx.measureText(message.text).width) / 2; // calculo para centralizar o texto na tela
                    ctx.fillText(message.text, message.x, message.y); // escreve na tela
                }
            }
        }
    }

    loop();

}());