Talk companion
========================

Source code for the interactive presentation slide deck I gave at Smashing Conference in Whistler in December
2014, and also the companion site that the audience can use to follow along.

The article explaining the whole setup can be found at https://medium.com/p/189fdbcd244c

The recording of the presentation is not yet available, but I will update this space whenever it is.

You can check out the companion site at aresluna.org/whistler, although you won’t be able to experience
the live syncing functionality since I already gave my talk. :·)

TODO ADD DIAGRAM?

## Installing and testing all the pieces locally

If you clone the repo, you will see three directories: presentation, remote, and server. 
Let’s take a look at them one by one.

# The presentation

This is the presentation that I (the presenter) would run from my computer connected to the projector.
To do it:

1. Go to the /presentation directory.

2. Pointing to index.html in the browser doesn’t work so well these days owing to cross-domain limitations.
You have to run a local web server. My favourite way to do it is actually to use PHP’s server (it seems
to support multiple connections, which Python’s doesn’t). 
php -S localhost:3999 (or python) TODO

This will start the server on port 3999. (Don’t ask me why I chose this number.)

3. Open http://localhost:3999 in your browser. Remember that the talk was designed and tested for Chrome only.

You can then explore the presentation. Don’t forget to press space on slide 24!


# The server

This is the server I used to communicate between my presentation and any companion sites used by audience
members.

1. Go to the /server directory.

2. Run npm install. You only have to do it once. (If that doesn’t work, install Node and NPM installed.)

3. Run node server.js. 

This will start the server on port 80/8080.

4. To test this, go back to the presentation and open it using a different URL: http://localhost:3999/?companion&local. companion means: try to communicate with the companion sites via the server. local means: use the local server for debugging, instead of the live one.

Now, as you navigate the slides, the presentation should output, in the web inspector, something like this:

Server: Updated max slide to 9…
Server: Updated max slide to 10…
Server: Updated max slide to 11…

And, in the terminal window where you have the node server running, you should see something like this:

Received updates from the presentation… /?newSlideMax=14&skipIfPressedOnTime=false
Received updates from the presentation… /?newSlideMax=15&skipIfPressedOnTime=false
Received updates from the presentation… /?newSlideMax=16&skipIfPressedOnTime=false

In order to test the server manually, you can use:

curl -X POST http://localhost:8080/update/?newSlideMax=4 (simulate setting the new slide to 4)
curl http://localhost:8080 (simulate reading the status via GET)

# The companion

This is the separate website that would normally be hosted outside and accessed by audience members.

1. Go to the /companion directory.

2. Run the webserver via php -S localhost:4000 (or python).

3. In another window, go to http://localhost:4000?local. You can try a different browsers, or a few of them.

Now, as you go back to the tab http://localhost:3999, go back to the first slide and reload. Now, 
all the companion sites you opened above should follow the slides.

Look into the console of the companion sites to see the traffic, e.g.
Received poll data… Object {slideMax: "51", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "51", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "52", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "53", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "54", skipIfPressedOnTime: false}
Polling…
Received poll data… Object {slideMax: "54", skipIfPressedOnTime: false}



## Preparing it for production

# Presentation

The presentation is good as it is. The whole idea is you’d be presenting it locally from your computer,
so not much more needs to be done.

# Server

The server should be hosted somewhere public. I used Nodejitsu. It’s not free, so you might want to use
something else that supports websockets. (I heard Heroku does as of recently.) 

There’s nothing secret about Nodejitsu, I just deployed there, and wrote down the URL. It looked something
like my-name.jit.su. 

I then changed SERVER_URL_UPDATE at the top of presentation/js/scripts.js, and SERVER_URL and 
SERVER_URL_WEBSOCKETS at the top of companion/js/scripts.js.

You can then test the communication between the presentation and the server as we did locally 
above – just remove the ?local from the URL.

# Companion

I hosted it on my regular external-facing Apache web server where I host my other sites. There’s nothing preventing you from hosting it in the same space as the server above.

Remember to update CORS_WHITELIST with your domain in server/server.js, so that your companion sites
are allowed to read the status.

var CORS_WHITELIST = ['http://localhost:3999', 'http://localhost:4000', 'http://aresluna.org']

Access it without the ?local parameter.

# Posting to Twitter

This requires registering a new app at Twitter, and then getting an account at OAuth.Io, which is used
for authentication.

1. I registered the app at Twitter. I went to https://apps.twitter.com, clicked Create New App.

In the Settings tab, I changed the Callback URL to https://oauth.io/auth (not sure if this is 
actually necessary). 

I also changed Website to read http://aresluna.org, which should match your live companion server above (my companion site lives at aresluna.org/whistler).

In the Permissions tab, I changed Access to Read and Write.

Then, I opened Keys and Access Tokens tab in preparation for the next step.

2. I opened a new tab, went to https://oauth.io, created an account.

I added a new app.

I changed “domains & URLs whitelist” to say “localhost, aresluna.org, www.aresluna.org” (my companion site lives at aresluna.org/whistler).
^ LOCALHOST:3999? LOCALHOST:4000?

I added a Twitter provider. In the client_id, I copied/pasted a key found on the apps.twitter.com page, in my app, in Keys and Access Tokens tab, in Application Settings, under Consumer Key (API Key). In the client_secret, I did the same for Consumer Secret (API Secret).

Now, you should be able to tweet from both the local dev companion (localhost:4000), and wherever you put the external one!


## Updating the slides

Now that everything’s working, you might want to actually use it for your own presentation.

So, update the slides in presentation/index.html as you see fit.

# Updating the metadata

1. With your presentation opened (localhost:3999), press Shift-D.

2. You will see a huge JSON structure corresponding to your slides.

3. Copy it.

4. Go to companion/js/scripts.js and paste it over the existing SLIDE_INFO structure.

# Updating the images

This is still a very manual process, sorry!

1. Take a screenshot of each slide. 

2. Save as PNG or JPEG (better JPEG).

3. You might want to optimize either with ImageOptim.

4. Drop the images into companion/images/slides.

This should be it!
