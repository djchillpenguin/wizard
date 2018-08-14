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
let fireballSpeed = 400;
let fireballOffsetX = 40;
let fireballOffsetY = 30;

function preload ()
{
    this.load.image('tiles', 'assets/dungeonTiles.png');
    this.load.tilemapTiledJSON('map', 'assets/map2.json');
    this.load.spritesheet('wizard', 'assets/wizard.png', { frameWidth: 72, frameHeight: 80 });
    this.load.spritesheet('fireball', 'assets/fireball.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('dungeon', 'music/dungeon.mp3');
}

function create ()
{
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('dungeonTiles', 'tiles');
    const belowLayer = map.createStaticLayer('Below Layer', tileset, 0, 0);
    const worldLayer = map.createStaticLayer('World Layer', tileset, 0, 0);

    worldLayer.setCollisionByProperty({ collides: true });


    wizard = this.physics.add.sprite(400, 300, 'wizard').setSize(60, 40).setOffset(0, 40);

    fireball = this.physics.add.sprite(370, 285, 'fireball');
    fireball.setAlpha(0);

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
    })

    this.anims.create({
        key: 'shoot',
        frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: 0
    })

    cursors = this.input.keyboard.createCursorKeys();
    up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    let music = this.sound.add('dungeon');
    music.play();

    const camera = this.cameras.main;
    camera.startFollow(wizard);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function update ()
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
        if(fireball.isShot) {
            wizard.anims.play('cast', true);
        }
        else {
            wizard.anims.play('down', true);
        }
    }

    if (this.input.activePointer.isDown && !fireball.isShot) {
        fireball.setAlpha(1);
        x = this.input.activePointer.x - (400 - fireballOffsetX);
        y = this.input.activePointer.y - (300 - fireballOffsetY);
        shotX = fireball.x;
        shotY = fireball.y;
        fireball.setVelocityX(findXshotVelocity(x, y));
        fireball.setVelocityY(findYshotVelocity(x, y));
        fireball.isShot = true;
        fireball.anims.play('shoot', true);
        wizard.anims.play('cast', true);
    }
    else if (fireball.isShot){
        if(Math.abs(fireball.x - shotX) > 500 || Math.abs(fireball.y - shotY) > 500) {
            fireball.setAlpha(0);
            fireball.x = wizard.x;
            fireball.y = wizard.y;
            fireball.isShot = false;
        }
    }
    else {
        fireball.setAlpha(0);
        fireball.x = wizard.x - fireballOffsetX;
        fireball.y = wizard.y - fireballOffsetY;
    }
}

function findXshotVelocity(x, y) {
    let angle;
    angle = Math.atan(Math.abs(y) / Math.abs(x));

    if (x < 0) {
        return (fireballSpeed * Math.cos(angle)) * -1;
    }
    else {
        return fireballSpeed * Math.cos(angle);
    }
}

function findYshotVelocity(x, y) {
    let angle;
    angle = Math.atan(Math.abs(y) / Math.abs(x));

    if (y < 0) {
        return (fireballSpeed * Math.sin(angle)) * -1;
    }
    else {
        return fireballSpeed * Math.sin(angle);
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
