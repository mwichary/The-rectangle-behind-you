Talk companion
========================

Source code for the interactive presentation slide deck I gave at Smashing Conference in Whistler in December
2014, and also the companion site that the audience can use to follow along.

The article explaining the whole setup can be found at https://medium.com/p/189fdbcd244c

The recording of the presentation is not yet available, but I will update this space whenever it is.

You can check out the companion site at [aresluna.org/whistler](http://aresluna.org/whistler), although you won’t be able to experience
the live syncing functionality since I already gave my talk. :·)

<img src='https://d262ilb51hltx0.cloudfront.net/max/2000/1*CGvjfqF2fu4_rg9uMtmOVA.png'>

# Installing and testing all the pieces locally

If you clone the repo, you will see three directories: presentation, remote, and server. 
Let’s take a look at them one by one.
p
### The presentation

This is the presentation that I (the presenter) would run from my computer connected to the projector.
To do it:

1. Go to the _/presentation_ directory.

2. Pointing to _index.html_ in the browser doesn’t work so well these days owing to cross-domain limitations.
You have to run a local web server. My favourite way to do it is actually to use PHP’s server (it seems
to support multiple connections, which Python’s doesn’t). 
_php -S localhost:3999_ (or _python -m SimpleHTTPServer 3999_)

This will start the server on port 3999. (Don’t ask me why I chose this number.)

3. Open _http://localhost:3999_ in your browser. Remember that the talk was designed and tested for Chrome only.

You can then explore the presentation. Don’t forget to press space on slide 24!


### The server

This is the server I used to communicate between my presentation and any companion sites used by audience
members.

1. Go to the _/server_ directory.

2. Run _npm install_. You only have to do it once. (If that doesn’t work, install Node and NPM installed.)

3. Run _node server.js_ 

This will start the server on port 80/8080.

4. To test this, go back to the presentation and open it using a different URL: _http://localhost:3999/?companion&local_,  _?companion_ means: try to communicate with the companion sites via the server. _&local_ means: use the local server for debugging, instead of the live one.

Now, as you navigate the slides, the presentation should output, in the web inspector, something like this:
```
Server: Updated max slide to 9…
Server: Updated max slide to 10…
Server: Updated max slide to 11…
```
And, in the terminal window where you have the node server running, you should see something like this:
```
Received updates from the presentation… /?newSlideMax=14&skipIfPressedOnTime=false
Received updates from the presentation… /?newSlideMax=15&skipIfPressedOnTime=false
Received updates from the presentation… /?newSlideMax=16&skipIfPressedOnTime=false
```
In order to test the server manually, you can use:

_curl -X POST http://localhost:8080/update/?newSlideMax=4_ (simulate setting the new slide to 4)

_curl http://localhost:8080_ (simulate reading the status via GET)

### The companion

This is the separate website that would normally be hosted outside and accessed by audience members.

1. Go to the _/companion_ directory.

2. Run the webserver via _php -S localhost:4000_ (or _python -m SimpleHTTPServer 4000_).

3. In another window, go to _http://localhost:4000?local_. You can try a different browsers, or a few of them.

Now, as you go back to the tab _http://localhost:3999_, go back to the first slide and reload. Now, 
all the companion sites you opened above should follow the slides.

Look into the console of the companion sites to see the traffic, e.g.
```
Received poll data… Object {slideMax: "51", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "51", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "52", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "53", skipIfPressedOnTime: false}
Received socket with data… Object {slideMax: "54", skipIfPressedOnTime: false}
Polling…
Received poll data… Object {slideMax: "54", skipIfPressedOnTime: false}
```


# Preparing it for production

### Presentation

The presentation is good as it is. The whole idea is you’d be presenting it locally from your computer,
so not much more needs to be done.

### Server

The server should be hosted somewhere public. I used Nodejitsu. It’s not free, so you might want to use
something else that supports websockets. (I heard Heroku does as of recently.) 

There’s nothing secret about Nodejitsu, I just deployed there, and wrote down the URL. It looked something
like my-name.jit.su. 

I then changed _SERVER_URL_UPDATE_ at the top of _presentation/js/scripts.js_, and _SERVER_URL_ and 
_SERVER_URL_WEBSOCKETS_ at the top of _companion/js/scripts.js_.

You can then test the communication between the presentation and the server as we did locally 
above – just remove the ?local from the URL.

### Companion

I hosted it on my regular external-facing Apache web server where I host my other sites. There’s nothing preventing you from hosting it in the same space as the server above.

Remember to update _CORS_WHITELIST_ with your domain in _server/server.js_, so that your companion sites
are allowed to read the status.

```
var CORS_WHITELIST = ['http://localhost:3999', 'http://localhost:4000', 'http://aresluna.org']
```

Access it without the _?local_ parameter.

### Posting to Twitter

This requires registering a new app at Twitter, and then getting an account at OAuth.Io, which is used
for authentication.

#### Twitter registration

1. I registered the app at Twitter. I went to _https://apps.twitter.com_, clicked Create New App.

2. In the Settings tab, I changed the Callback URL to _https://oauth.io/auth_ (not sure if this is 
actually necessary). 

3. I also changed Website to read _http://aresluna.org_, which should match your live companion server above (my companion site lives at _aresluna.org/whistler_).

4. In the Permissions tab, I changed Access to Read and Write.

5. Then, I opened Keys and Access Tokens tab in preparation for the next step.

#### OAuth registration

1. I opened a new tab, went to _https://oauth.io_, created an account.

2. I added a new app.

3. I changed “domains & URLs whitelist” to say “localhost, aresluna.org, www.aresluna.org” (my companion site lives at _aresluna.org/whistler_).

4. I added a Twitter provider. In the client_id, I copied/pasted a key found on the apps.twitter.com page, in my app, in Keys and Access Tokens tab, in Application Settings, under Consumer Key (API Key). In the client_secret, I did the same for Consumer Secret (API Secret).

5. Now, you should be able to tweet from both the local dev companion (localhost:4000), and wherever you put the external one!


# Updating the slides

Now that everything’s working, you might want to actually use it for your own presentation.

So, update the slides in _presentation/index.html_ as you see fit.

### Updating the metadata

1. With your presentation opened (_localhost:3999_), press Shift-D.

2. You will see a huge JSON structure corresponding to your slides.

3. Copy it.

4. Go to _companion/js/scripts.js_ and paste it over the existing _SLIDE_INFO_ structure.

### Updating the images

This is still a very manual process, sorry!

1. Take a screenshot of each slide. 

2. Save as PNG or JPEG (better JPEG).

3. You might want to optimize either with ImageOptim.

4. Drop the images into companion/images/slides.

This should be it!
