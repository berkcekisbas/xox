/**
 * Socket bağlantısı
 */
var socket = io.connect('http://104.248.136.110');

/**
 *  2 oyuncu 0 = X, 1 = O
 */
var players = ["X", "O"];

/**
 * oyuncu tip 0 = X, 1 = O
 */
var type = null;

/**
 * Oyun tahtası
 */
var board = null;

/**
 * Kullanıcı id'si
 */
var id = null;

/**
 * Sistemdeki herkes
 */
var all = [];



/**
 * Oyunu başlatma
 */
function reset() {
    $("#game-over").hide();
    $('#board').hide();
    $("#chooseMark").show();

    $('#status').html('');
    $('#typeStatus').html('');

    board = [null, null, null, null, null, null, null, null, null];
    $('.cell').html('');

    $("#chooseMark button").prop('disabled', false);
    $("#chooseMark button").removeClass('disabled');

    $("#chooseMark button").click(function () {
        var _type = $(this).data('type');
        $("#chooseMark button").prop('disabled', true);
        $("#chooseMark button").addClass('disabled');

        /**
         * Arka tarafa seçilen tipi gönder
         */
        socket.emit('choosed mark', _type);

        type = _type;
    });
}

/**
 * Oyun tahtasını oluşturma
 */
function createBoard() {
    $("#board").show();
}

/**
 * Alan atama
 */
function assignCell(cell) {
    drawCell(players[type]);
    board[cell] = type;
}

/**
 * Alan doldurma
 */
function drawCell(cell, sign) {
    $("#" + cell).text(sign);
}

/**
 * Oyun tahtasını aktif et
 */
function turnOnBoard() {
    $(".cell").click(function () {
        // check to see if cell picked already
        var picked = $(this).attr('id');
        if (board[picked] === null) {
            socket.emit('picked', picked);
        }
    });
}

/**
 * Oyunu bitir
 * @param result
 */
function endGame(result) {
    $('#status').html('Oyun bitti');
    $("#game-over").show();
    if (result == 2) {
        $("#message").text('Berabere');
        $("#game-over").css("background-color", "#7575a350");
    }
    else if (result == type) {
        $("#message").text('Kazandın!');
        $("#game-over").css("background-color", "#33cc3350");
    }
    else {
        $("#message").text('Kaybettin!');
        $("#game-over").css("background-color", "#cc330050");
    }
}

/**
 * Oyun tahtasını pasif et
 */
function turnOffBoard() {
    $(".cell").off();
}

/**
 * Oyun tahtası güncelleme
 */
function updateBoard() {
    board.forEach(function (b, index) {
        drawCell(index, players[b]);
    });
}

reset();
$('#newGame').click(function () {
    socket.emit('get players');
    reset();
});

/**
 * Bağlandı bilgisi
 */
socket.on('connected', function (data) {
   id = data;
});

/**
 * Tüm kullanıcılar
 */
socket.on('all', function (data) {
    all = data;
});

/**
 * Kullanıcı 1 geldi
 */
socket.on('choosed player 1', function (data) {
    if (data === id) {
        type = 0;
        $('#typeStatus').html('İşaret : X');
    }
    $("#l1").prop('disabled', true);
    $("#l1").addClass('disabled');
});

/**
 * Kullanıcı 1 gitti
 */
socket.on('disconnected player 1', function (data) {
    if (data === id) {
        type = null;
    }
    /**
     * TODO: Oyunu durdur
     */
});

/**
 * Kullanıcı 2 geldi
 */
socket.on('choosed player 2', function (data) {
    if (data === id) {
        type = 1;
        $('#typeStatus').html('İşaret : 0');
    }
    $("#l3").prop('disabled', true);
    $("#l3").addClass('disabled');
});

/**
 * Kullanıcı 2 gitti
 */
socket.on('disconnected player 2', function (data) {
    if (data === id) {
        type = null;
    }
    /**
     * TODO: Oyunu durdur
     */
});

/**
 * Oyun başlasın
 */
socket.on('start game', function (data) {
    board = data.board;
    $("#typeStatus").show();
    $("#chooseMark").hide();
    createBoard();
});

/**
 * Oyun tahtası güncellendi
 */
socket.on('board', function (data) {
   board = data.board;
   if (data.playQueue === type) {
       $('#status').html('Sıra sende');
       turnOnBoard();
   } else {
       $('#status').html('Sıra karşıda');
       turnOffBoard();
   }
   updateBoard();
});

/**
 * Oyun bitti
 */
socket.on('finished game', function (data) {
    endGame(data.winning);
});