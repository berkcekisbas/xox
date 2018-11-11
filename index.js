var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

/**
 * Statik dosyalar
 */
app.use(express.static('src/assets'));

/**
 * 80 portunda çalış
 */
server.listen(8001);

/**
 * Ana route çağrıldığında /src/index.html dosyasını gönder
 */
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/src/index.html');
});

/**
 * Oyuncu ve ziyaretçiler
 */
var player1 = null;
var player2 = null;
var guests = [];
var all = [];
/**
 * Oyun tahtası
 */
var board = [
    null, null, null,   // 0, 1, 2
    null, null, null,   // 3, 4, 5
    null, null, null    // 6, 7, 8
];
/**
 * Kazanma şartları
 */
var wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // yatay kazanma
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // dikey kazanma
    [0, 4, 8], [2, 4, 6] // çarpraz kazanma
];

function clearBoard() {
    board = [null, null, null, null, null, null, null, null, null];
}

function reverseType(type) {
    if (type === 0) {
        return 1;
    }
    return 0;
}

function checkBoard(board, type) {
   let result = null;
    /**
     * Kazanma şartlarını kontrol etme
     */
    wins.forEach(w => {
        /**
         * Gelen type kazanma şartlarından birine uyarsa oyun bitme bildirimi gönder
         */
        let status = true;
        w.forEach(s => {
            if (board[s] !== type) {
                status = false;
            }
        });
        if (status) {
            result = {
              status: 'finished',
              winning: type,
            };
        }
    });

    if (!result && board.indexOf(null) === -1) {
        result = {
            status: 'finished',
            winning: 2,
        }
    }

    return result;
}

io.on('connection', socket => {
    let type = null;

    /**
     * Kullanıcı ilk girdiğinde oyuncu varsa bilgilerini gönderme
     */
    if (player1) {
        socket.emit('choosed player 1', player1);
    }
    if (player2) {
        socket.emit('choosed player 2', player2);
    }

    /**
     * Kullanıcıya id'sini döndürüyoruz
     */
    socket.emit('connected', socket.id);

    /**
     * Gelen kullanıcıyı all dizinine ekle
     */
    all.push(socket.id);

    /**
     * Tüm bağlantılara tüm kullanıcıların bilgisini gönder
     */
    io.emit('all', all);

    socket.on('disconnect', () => {
        /**
         * Kullanıcı çıktığında all dizininden sil
         */
        index = all.findIndex(u => u === socket.id);
        all.splice(index, 1);

        /**
         * Tüm bağlantılara tüm kullanıcıların bilgisini gönder
         */
        io.emit('all', all);

        /**
         * Çıkan kullanıcı 1 ise
         */
        if (player1 === socket.id) {
            player1 = null;
            io.emit('disconnected player 1', socket.id);
        }

        /**
         * Çıkan kullanıcı 2 ise
         */
        if (player2 === socket.id) {
            player2 = null;
            io.emit('disconnected player 2', socket.id);
        }
    });

    socket.on('choosed mark', data => {
        /**
         * Kullanıcı 1 boşsa ve gelen veri 0 ise kullanıcı 1 e ata
         */
        if (!player1 && data === 0) {
            type = 0;
            player1 = socket.id;
            io.emit('choosed player 1', socket.id);
        }

        /**
         * Kullanıcı 2 boşsa ve gelen veri 1 ise kullanıcı 2 ye ata
         */
        if (!player2 && data === 1) {
            type = 1;
            player2 = socket.id;
            io.emit('choosed player 2', socket.id);
        }

        /**
         * 2 kullanıcı da doldu ise oyunun başlaması için oyun tahtasını gönder
         */
        if (player1 && player2) {
            clearBoard();
            io.emit('start game', {board})
            io.emit('board', {board, playQueue: 0})
        }
    });

    /**
     * Bir alan işaretlendiğinde
     */
    socket.on('picked', data => {
        if (type === 0 || type === 1) {
            board[data] = type;
            const checkBoardStatus = checkBoard(board, type);
            io.emit('board', {board, playQueue: reverseType(type)});
            if (checkBoardStatus) {
                clearBoard();
                player1 = null;
                player2 = null;
                io.emit('finished game', checkBoardStatus);
            }
        }
    });

    /**
     * Oyuncu listesi istendiğinde
     */
    socket.on('get players', () => {
        if (player1) {
            socket.emit('choosed player 1', player1);
        }
        if (player2) {
            socket.emit('choosed player 2', player2);
        }
    })
});
