var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

//global variables
let wizard;
let wizardWorldCollider;
let wizardSpeed = 200;
let cursors;
let up, down, right, left;
let lastFired = 0;
let map;

//Fireball class for creating the fireballs the wizard shoots

let Fireball = new Phaser.Class({

    Extends: Phaser.Physics.Arcade.Sprite,

    initialize:

    function Fireball (scene)
    {
        Phaser.Physics.Arcade.Sprite.call(this, scene, 0, 0, 'fireball');

        this.speed = 400;
        this.lifespan = 2000;
        this.offsetX = 40;
        this.offsetY = 30;
        this.cooldown = 400;
    },

    shoot: function (wizard, mouseX, mouseY)
    {
        this.lifespan = 2000;

        this.setActive(true);
        this.setVisible(true);
        this.setPosition(wizard.x - this.offsetX, wizard.y - this.offsetY);

        if (wizard.x < 400) {
            x = mouseX - (wizard.x - this.offsetX);
        }
        else if (wizard.x > (map.widthInPixels - 400)) {
            x = mouseX - (800 - (map.widthInPixels - wizard.x - this.offsetX));
        }
        else {
            x = mouseX - (400 - this.offsetX);
        }

        if (wizard.y < 300) {
            y = mouseY - (wizard.y - this.offsetY);
        }
        else if (wizard.y > (map.heightInPixels - 300)) {
            y = mouseY - (600 - (map.heightInPixels - wizard.y - this.offsetY));
        }
        else {
            y = mouseY - (300 - this.offsetY);
        }

        //x = mouseX - (400 - this.offsetX);
        //y = mouseY - (300 - this.offsetY);

        velX = this.findXshotVelocity(x, y);
        velY = this.findYshotVelocity(x, y);
        this.setVelocityX(velX);
        this.setVelocityY(velY);
        this.anims.play('shoot', true);
        console.log('wizardX =', wizard.x, 'mouseX =', mouseX);
        console.log('wizardY =', wizard.y, 'mouseY =', mouseY);
        console.log('X =', x, 'Y =', y);
    },

    update: function (time, delta)
    {
        this.lifespan -= delta;

        if (this.lifespan <= 0)
        {
            this.kill();
        }
    },

    kill: function ()
    {
        this.setActive(false);
        this.setVisible(false);
        this.body.stop();
    },

    findXshotVelocity: function (x, y) {
        let angle;
        angle = Math.atan(Math.abs(y) / Math.abs(x));

        if (x < 0) {
            return (this.speed * Math.cos(angle)) * -1;
        }
        else {
            return this.speed * Math.cos(angle);
        }
    },

    findYshotVelocity: function(x, y) {
        let angle;
        angle = Math.atan(Math.abs(y) / Math.abs(x));

        if (y < 0) {
            return (this.speed * Math.sin(angle)) * -1;
        }
        else {
            return this.speed * Math.sin(angle);
        }
    }
});

/*let Goblin = new Phaser.Class({

});*/

function preload ()
{
    this.load.image('tiles', 'assets/dungeonTiles.png');
    this.load.tilemapTiledJSON('map', 'assets/map2.json');
    this.load.spritesheet('wizard', 'assets/wizard.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('fireball', 'assets/fireball.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('goblin', 'assets/goblin.png', { frameWidth: 80, frameHeight: 80});
    this.load.audio('dungeon', 'music/dungeon.mp3');
}

function create ()
{
    map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('dungeonTiles', 'tiles');
    const belowLayer = map.createStaticLayer('Below Layer', tileset, 0, 0);
    const worldLayer = map.createStaticLayer('World Layer', tileset, 0, 0);

    worldLayer.setCollisionByProperty({ collides: true });


    wizard = this.physics.add.sprite(400, 300, 'wizard').setSize(52, 76).setOffset(20, 20);
    goblin = this.physics.add.sprite(600, 200, 'goblin').setSize(80, 80).setOffset(0, 0);

    fireballs = this.physics.add.group({
        classType: Fireball,
        maxSize: 10,
        runChildUpdate: true
    });

    this.physics.add.collider(wizard, worldLayer);

    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('wizard', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('wizard', { start: 2, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('wizard', { start: 4, end: 5 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('wizard', { start: 6, end: 7 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'cast',
        frames: [ { key: 'wizard', frame: 8 } , {key: 'wizard', frame: 1 } ],
        frameRate: .01,
        repeat: -1
    });

    this.anims.create({
        key: 'shoot',
        frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: 0
    });

    cursors = this.input.keyboard.createCursorKeys();
    up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    let music = this.sound.add('dungeon');
    //music.play();

    const camera = this.cameras.main;
    camera.startFollow(wizard);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function update (time, delta)
{
    if(isLeft() && isUp()) {
        wizard.setVelocityX(Math.cos(Math.PI / 4) * wizardSpeed * -1);
        wizard.setVelocityY(Math.sin(Math.PI / 4) * wizardSpeed * -1);
        wizard.anims.play('left', true);
    }
    else if(isLeft() && isDown()) {
        wizard.setVelocityX(Math.cos(Math.PI / 4) * wizardSpeed * -1);
        wizard.setVelocityY(Math.sin(Math.PI / 4) * wizardSpeed);
        wizard.anims.play('left', true);
    }
    else if(isRight() && isUp()) {
        wizard.setVelocityX(Math.cos(Math.PI / 4) * wizardSpeed);
        wizard.setVelocityY(Math.sin(Math.PI / 4) * wizardSpeed * -1);
        wizard.anims.play('right', true);
    }
    else if(isRight() && isDown()) {
        wizard.setVelocityX(Math.cos(Math.PI / 4) * wizardSpeed);
        wizard.setVelocityY(Math.sin(Math.PI / 4) * wizardSpeed);
        wizard.anims.play('right', true);
    }
    else if(isLeft()) {
        wizard.setVelocityX(wizardSpeed * -1);
        wizard.setVelocityY(0);
        wizard.anims.play('left', true);
    }
    else if(isRight()) {
        wizard.setVelocityX(wizardSpeed);
        wizard.setVelocityY(0);
        wizard.anims.play('right', true);
    }
    else if(isUp()) {
        wizard.setVelocityY(wizardSpeed * -1);
        wizard.setVelocityX(0);
        wizard.anims.play('up', true);
    }
    else if(isDown()) {
        wizard.setVelocityY(wizardSpeed);
        wizard.setVelocityX(0);
        wizard.anims.play('down', true);
    }
    else {
        wizard.setVelocityX(0);
        wizard.setVelocityY(0);
        if(lastFired > time) {
            wizard.anims.play('cast', true);
        }
        else {
            wizard.anims.play('down', true);
        }
    }

    if (this.input.activePointer.isDown && time > lastFired) {
        var fireball = fireballs.get();

        if (fireball)
        {
            fireball.shoot(wizard, this.input.activePointer.x, this.input.activePointer.y);

            lastFired = time + fireball.cooldown;
        }
        wizard.anims.play('cast', true);
    }
}

function isUp () {
    if(cursors.up.isDown) {
        return true;
    }

    if(up.isDown) {
        return true;
    }

    return false;
}

function isDown () {
    if(cursors.down.isDown) {
        return true;
    }

    if(down.isDown) {
        return true;
    }

    return false;
}

function isLeft() {
    if(cursors.left.isDown) {
        return true;
    }

    if(left.isDown) {
        return true;
    }

    return false;
}

function isRight() {
    if(cursors.right.isDown) {
        return true;
    }

    if(right.isDown) {
        return true;
    }

    return false;
}
