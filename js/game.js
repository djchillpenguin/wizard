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
            debug: false,
            fps: 60
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
let wizardSpeed = 200;
let cursors;
let up, down, right, left;
let lastFired = 0;
let map;
let camera;
let goblinCount = 0;
let lastGoblinSpawn = 0;
let goblinSpawnTime = 2000;
let respawning = false;
let timedEvent;

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
        this.cooldown = 300;
    },

    shoot: function (wizard, mouseX, mouseY)
    {
        this.lifespan = 2000;
        this.body.enable = true;
        this.setDepth(2);
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

        //x = mouseX - ((camera.x - wizard.x) + 400 - this.offsetX);
        //y = mouseY - ((camera.y - wizard.y) + 300 - this.offsetY);

        velX = this.findXshotVelocity(x, y);
        velY = this.findYshotVelocity(x, y);
        this.setVelocityX(velX);
        this.setVelocityY(velY);
        this.anims.play('shoot', true);
        /*console.log('wizardX =', wizard.x, 'mouseX =', mouseX, 'cameraX =', camera.x);
        console.log('wizardY =', wizard.y, 'mouseY =', mouseY, 'cameraY =', camera.y);
        console.log('X =', x, 'Y =', y);*/
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
        this.body.enable = false;
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

//Goblin class

let Goblin = new Phaser.Class({

    Extends: Phaser.Physics.Arcade.Sprite,

    initialize:

    function Goblin (scene)
    {
        Phaser.Physics.Arcade.Sprite.call(this, scene, 0, 0, 'goblin');
        this.speed = 100;
        this.isAlive = true;
    },

    spawn: function (x, y)
    {
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.body.enable = true;
        this.body.setSize(72, 72);
        this.body.setOffset(0, 8);
        this.isAlive = true;
        this.setDepth(1);
    },

    update: function (time, delta)
    {
        if (this.isAlive)
        {
            this.setVelocityX(this.findXVelocity(wizard.x - this.x, wizard.y - this.x));
            this.setVelocityY(this.findYVelocity(wizard.x - this.x, wizard.y - this.y));
        }
    },

    kill: function ()
    {
        this.isAlive = false;
        this.anims.play('goblinDie', true);
        this.setDepth(0);
        //this.setActive(false);
        //this.setVisible(false);
        //this.body.stop();

        timedEvent = this.scene.time.addEvent({
            delay: 10000,
            callback: onEvent,
            callbackScope: this
        });

        this.body.enable = false;

        function onEvent(){
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();
        }
    },

    findXVelocity: function (x, y) {
        let angle;
        angle = Math.atan(Math.abs(y) / Math.abs(x));

        if (x < 0) {
            this.anims.play('goblinLeft', true);
            return (this.speed * Math.cos(angle)) * -1;
        }
        else {
            this.anims.play('goblinRight', true);
            return this.speed * Math.cos(angle);
        }
    },

    findYVelocity: function(x, y) {
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

//Scene functions

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
    wizard.moveShotDelay = 200;
    wizard.shotTime = 0;
    wizard.hasShot = false;
    wizard.setDepth(1);

    goblins = this.physics.add.group({
        classType: Goblin,
        maxSize: 20,
        runChildUpdate: true
    });

    fireballs = this.physics.add.group({
        classType: Fireball,
        maxSize: 10,
        runChildUpdate: true
    });

    this.physics.add.collider(wizard, worldLayer);
    this.physics.add.collider(fireballs, worldLayer, fireballVsWorld);
    this.physics.add.collider(goblins, worldLayer);

    //wizard animations
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

    //goblin animations
    this.anims.create({
        key: 'goblinIdle',
        frames: [ { key: 'goblin', frame: 0 } ],
        frameRate: 3,
        repeat: 0
    });

    this.anims.create({
        key: 'goblinRight',
        frames: this.anims.generateFrameNumbers('goblin', { start: 1, end: 2 }),
        frameRate: 3,
        repeat: -1
    });

    this.anims.create({
        key: 'goblinLeft',
        frames: this.anims.generateFrameNumbers('goblin', { start: 3, end: 4 }),
        frameRate: 3,
        repeat: -1
    });

    this.anims.create({
        key: 'goblinDie',
        frames: this.anims.generateFrameNumbers('goblin', { start: 5, end: 10 }),
        frameRate: 8,
        repeat: 0
    });

    cursors = this.input.keyboard.createCursorKeys();
    up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    let music = this.sound.add('dungeon');
    music.play();

    camera = this.cameras.main;
    camera.startFollow(wizard);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function update (time, delta)
{
    if(goblinCount === 0 && respawning === false)
    {
        lastGoblinSpawn = time;
        respawning = true;
    }

    if(goblinCount === 0 && (time - lastGoblinSpawn) > goblinSpawnTime) {
        goblinCount++;
        respawning = false;
        goblin = goblins.get();
        goblin.spawn(Math.floor((Math.random() * 100) + 499), Math.floor((Math.random() * 100) + 399));
    }

    if (!wizard.hasShot)
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
            wizard.anims.play('down', true);
        }
    }

    if(wizard.hasShot === true && (time - wizard.shotTime) > wizard.moveShotDelay)
    {
        wizard.hasShot = false;
    }

    if (this.input.activePointer.isDown && time > lastFired) {
        wizard.setVelocityX(0);
        wizard.setVelocityY(0);
        wizard.hasShot = true;
        wizard.shotTime = time;
        wizard.anims.play('cast', true);

        var fireball = fireballs.get();

        if (fireball)
        {
            fireball.shoot(wizard, this.input.activePointer.x, this.input.activePointer.y);

            if(goblinCount > 0) {
            this.physics.add.collider(goblins, fireball, enemyHitCallback);
            }

            lastFired = time + fireball.cooldown;
        }
        wizard.anims.play('cast', true);
    }
}

function enemyHitCallback(enemyHit, spellHit)
{
    if(spellHit.active === true && spellHit.active === true)
    {
        enemyHit.kill();
        spellHit.kill();
        goblinCount--;
    }
}

function fireballVsWorld(fireball)
{
    fireball.kill();
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
