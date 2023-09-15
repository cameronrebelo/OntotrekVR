OntoTrekVR is an alternate version of the 3D ontology visualisation tool, OntoTrek (available at **[http://genepio.org/ontotrek](http://genepio.org/ontotrek)**). This is an experimental prototype used for a honours research project and contains a subset of features implemented on OntoTrek.

<hr />

## Running this on your computer

OntoTrekVR can be run immediately in your browser if you have cloned the github repo to your computer.  Since the index.html app page script fetches the selected ontology file in .json format from the data/ subfolder, it requires running a local webserver from the folder it is located in, e.g. 
    
    > python -m http.server

This enables one to open a web browser, usually with URL http://localhost:8000/index.html to run the application.

Currently the aplication does not have a authorised private key and certificate, so to access the tool, proceed past your browser's warning about unsafe websites.

To view the application in VR, use the browser of your headset and navigate to the IP address and port of your host machine. The graph will offer a fullscreen button on the rendered graph that will load the application in VR.