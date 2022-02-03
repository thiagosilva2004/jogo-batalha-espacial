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

    // sprites
    // cenario
    var background = new Sprite(0, 56, 400, 500, 0, 0); 
    sprites.push(background);

    // nave que controlamos
    var defender = new Sprite(0, 0, 30, 50, 185, 450);
    sprites.push(defender);

    // imagens
    var img = new Image();
    img.addEventListener('load', loadHandler, false);
    img.src = "image/img.png";
    assetsToLoad.push(img);
    // contador de recursos
    var loadedAssets = 0;

    // entradas apagar caso nao precise usar
    var LEFT = 37, RIGHT = 39, ENTER = 13, SPACE = 32;

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
                if(gameState != PLAYING){
                    gameState = PLAYING;
                }else{
                    gameState = PAUSED;
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
                i--;
            }
        }
    }

    // criação dos mísseis
    function fireMissile() {
        var missile = new Sprite(136, 12, 8, 13, defender.centerX() - 4, defender.y - 13);
        missile.velocidadeEmY = -8;
        sprites.push(missile);
        missiles.push(missile);
    }

    // remove os objetos inutes do jogo
    function removeObjects(objectsToRemove, array){
        var pos = array.indexOf(objectsToRemove); // pega a posição do objeto no array
        if(pos !== -1){ // verifica se o objeto existe
            array.splice(pos, 1); // remove o objeto do array
        }
    }

    function render() {
        ctx.clearRect(0,0, cnv.width, cnv.height); // limpa a tela
        if(sprites.length !== 0){ // verifica se precisa rendelizar sprites
            for(var i in sprites){ // rendeliza todos os sprites
                var spr = sprites[i];
                // desenha na tela
                ctx.drawImage(img, spr.sourceX, spr.sourceY, spr.width, spr.height, Math.floor(spr.x), Math.floor(spr.y), spr.width, spr.height);
            }
        }
    }

    loop();

}());