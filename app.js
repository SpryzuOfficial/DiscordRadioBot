require('dotenv').config();

const path = require('path');
const Discord = require('discord.js');

const { dbConnection } = require('./config_database');
const keepAlive = require('./server');
const Role = require('./models/role');
const Voice = require('./models/voice');

const client = new Discord.Client();

let voiceChannel;

dbConnection();

client.on('ready', () =>
{
    client.user.setActivity("24/7 Radio", {
        type: "STREAMING"
    });

    console.log(client.user.tag);
});

client.on('message', async(message) =>
{
    const split_msg = message.content.split(' ');
    const command = split_msg.slice(0, 1)[0];
    const args = split_msg.slice(1);

    if(message.author.bot)
    {
        return;
    }

    if(command == process.env.PREFIX + 'help')
    {
        const embed = new Discord.MessageEmbed().setTitle("Radio Bot")
                    .setColor('#1199FF')
                    .addFields(
                        {
                            name: 'Introduction',
                            value: "Hello my name is " + client.user.tag
                        },
                        {
                            name: '**Configuration**\n· r-addrole [role-mention]',
                            value: "I will add the role provided to the database, that way just users with the role will be able to use `r-play` and `r-stop` commands"
                        },
                        {
                            name: '· r-delrole [role-mention]',
                            value: "I will delete the role from the database"
                        },
                        {
                            name: '· r-setvc [voice_channel-name]',
                            value: "I will set the default Voice channel to the provided"
                        },
                        {
                            name: '**Radio**\n· r-play [url]',
                            value: "I will join to the Voice channel and try to play the url provided"
                        },
                        {
                            name: '· r-stop',
                            value: "I will disconnect from the Voice channel"
                        },
                    );
                    
        await message.channel.send(embed);
    }

    if(command == process.env.PREFIX + 'setvc')
    {
        const vc = client.channels.cache.find(ch => ch.name == args[0]);

        if(vc)
        {
            if(vc.type == "voice")
            {
                const vcId = vc.id;

                const del = await Voice.deleteMany({});

                const voice = new Voice({vcId});

                try
                {
                    await voice.save();
                    message.channel.send('Voice channel added');
                }
                catch(error)
                {
                    console.log(error);
                    message.channel.send('Internal error, check logs for more info.');
                }
            }
            else
            {
                message.channel.send('Voice channel not provided');
            }
        }
    }

    if(command == process.env.PREFIX + 'addrole')
    {
        let roleId;
        if(args[0].split('<')[1])
        {
            roleId = args[0].split('<')[1].split('>')[0].split('@')[1].split('&')[1];
        }
        else
        {
            roleId = args[0];
        }

        const roleExist = await Role.findOne({roleId});

        if(!roleExist)
        {
            const role = new Role({roleId});

            try
            {
                await role.save();
                message.channel.send('Role added');
            }
            catch(error)
            {
                console.log(error);
                message.channel.send('Internal error, check logs for more info.');
            }
        }
        else
        {
            message.channel.send('Role already in database');
        }
    }

    if(command == process.env.PREFIX + 'delrole')
    {
        let roleId;
        if(args[0].split('<')[1])
        {
            roleId = args[0].split('<')[1].split('>')[0].split('@')[1].split('&')[1];
        }
        else
        {
            roleId = args[0];
        }

        try
        {
            const role = await Role.findOneAndDelete({roleId});

            if(role)
            {
                message.channel.send('Role deleted');
            }
        }
        catch(error)
        {
            console.log(error);
            message.channel.send('Internal error, check logs for more info.');
        }
    }
    
    try
    {
        const roles = await Role.find();
        roles.forEach(async(role) => 
        {   
            if(message.member.roles.cache.has(role.roleId))
            {
                if(command == process.env.PREFIX + 'play')
                {
                    const voice = await Voice.find();
                    voice.forEach(async(v) => 
                    {
                        voiceChannel = await client.channels.fetch(v.vcId);

                        await voiceChannel.join().then((connection) => 
                        {
                            const dispatcher = connection.play(args[0]);
                            
                            dispatcher.on("end", (end) =>
                            {
                                voiceChannel.leave();
                                message.channel.send('Out');
                            });
                        }).catch(err => console.log(err));
                    });
                }

                if(command == process.env.PREFIX + 'stop')
                {
                    if(voiceChannel != undefined)
                    {
                        voiceChannel.leave();
                    }
                }

                return;
            }
        });
    }
    catch(error)
    {
        console.log(error);
        message.channel.send('Internal error, check logs for more info.');
    }
});

if(process.env.PRODUCTION == 1)
{
    keepAlive();
}

client.login(process.env.TOKEN);
