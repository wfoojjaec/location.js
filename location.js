//wfoojjaec.eu.org
( function() {
    'use strict';
    try {
        location.options = Object.assign( {
            click : true,
            intersection : true,
            mutation : true,
            popstate : true,
            refresh : true,
            submit : true,
            onBeforeLoad : null,
            onAfterLoad : null,
            onError : null,
            /*
                https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
            */
            IntersectionObserver : {
                root : null,
                rootMargin : '0px',
                threshold : 1
            },
            /*
                https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
            */
            MutationObserver : {
                childList : true,
                attributes : true,
                characterData : false,
                subtree : true,
                attributeOldValue : true,
                characterDataOldValue : false,
                attributeFilter : [ 'data-location' ]
            },
            /*
                https://developer.mozilla.org/ru/docs/Web/API/Fetch_API/Using_Fetch
                https://learn.javascript.ru/fetch-api
            */
            fetch : {
                method : 'GET',
                headers : {},
                body : undefined,
                referrer : location.origin + location.pathname + location.search,
                referrerPolicy : 'no-referrer-when-downgrade',
                mode : 'cors',
                credentials : 'same-origin',
                cache : 'default',
                redirect : 'follow',
                integrity : '',
                keepalive : true,
                signal : undefined,
                window : window
            }
        }, location.options );
        location.load = typeof location.load === 'function' ? location.load : function( event = null, href = location.origin + location.pathname + location.search, pushState = true ) {
            if( typeof location.AbortController === 'object' )
                location.AbortController.abort();
            location.AbortController = new AbortController();
            location.options.fetch.signal = location.AbortController.signal;
            clearTimeout( location.timeout );
            if( typeof location.options.onBeforeLoad === 'function' )
                location.options.onBeforeLoad( event, href, pushState );
            fetch( href + ( pushState ? '' : ( href.indexOf( '?' ) === -1 ? '?' : '&' ) + 'rel=tab' ), location.options.fetch ).then( function( response ) {
                return response.ok ? response.text() : Promise.reject( new Error( response.statusText ) );
            } ).then( function( response ) {
                if( pushState )
                    history.pushState( { path : href }, document.title, href );
                location.IntersectionObserver.disconnect();
                location.MutationObserver.disconnect();
                document.open();
                document.write( response );
                document.close();
                if( typeof location.options.onAfterLoad === 'function' )
                    location.options.onAfterLoad( event, href, pushState );
                location.options.referer = href;
            } ).catch( function( error ) {
                if( typeof location.options.onError === 'function' )
                    location.options.onError( event, href, pushState );
            } );
        };
        document.addEventListener( 'click', function( event ) {
            if( location.options.click && event.button === 0 ) {
                var a = event.target.closest( 'a' );
                if( a && a.matches( 'a[data-location]' ) ) {
                    event.preventDefault();
                    location.load( event, a.href, true );
                }
            }
        } );
        location.IntersectionObserver = typeof location.IntersectionObserver === 'object' ? location.IntersectionObserver : new IntersectionObserver( function( entries, observer ) {
            if( location.options.intersection )
                entries.forEach( function( entry ) {
                    /*
                        IntersectionObserverEntry = {
                            boundingClientRect : DOMRectReadOnly,
                            intersectionRatio : 0,
                            intersectionRect : DOMRectReadOnly,
                            isIntersecting : false,
                            rootBounds : DOMRectReadOnly
                            target : Element,
                            time : DOMHighResTimeStamp
                        }
                    */
                    if( entry.isIntersecting ) {
                        location.IntersectionObserver.unobserve( entry.target );
                        fetch( entry.target.dataset.location, location.options.fetch ).then( function( response ) {
                            return response.ok ? response.text() : Promise.reject( new Error( response.statusText ) );
                        } ).then( function( response ) {
                            entry.target.innerHTML = response;
                            if( typeof location.options.onAfterLoad === 'function' )
                                location.options.onAfterLoad( entry, entry.target.dataset.location, true );
                        } ).catch( function( error ) {
                            if( typeof location.options.onError === 'function' )
                                location.options.onError( error, entry.target.dataset.location, true );
                        } );
                    }
                } );
        }, location.options.IntersectionObserver );
        document.querySelectorAll( '*[data-location]:not([data-location=""])' ).forEach( function( currentValue, currentIndex, listObj ) {
            location.IntersectionObserver.observe( currentValue );
        } );
        location.MutationObserver = typeof location.MutationObserver === 'object' ? location.MutationObserver : new MutationObserver( function( mutationsList, observer ) {
            if( location.options.mutation )
                mutationsList.forEach( function( mutation ) {
                    /*
                        MutationRecord = {
                            addedNodes : NodeList,
                            attributeName : null,
                            attributeNamespace : null,
                            nextSibling : null,
                            oldValue : null,
                            previousSibling : null,
                            removedNodes : NodeList,
                            target : Element,
                            type : 'childList' // childList, attributes, characterData
                        }
                    */
                    switch( mutation.type ) {
                        case 'childList' :
                            mutation.addedNodes.forEach( function( currentValue, currentIndex, listObj ) {
                                if( currentValue.dataset && currentValue.dataset.location )
                                    location.IntersectionObserver.observe( currentValue );
                            } );
                        break;
                        case 'attributes' :
                            if( mutation.attributeName === 'data-location' && mutation.target.dataset.location )
                                location.IntersectionObserver.observe( mutation.target );
                        break;
                    }
                } );
        } );
        location.MutationObserver.observe( document, location.options.MutationObserver );
        window.addEventListener( 'popstate', function( event ) {
            var href = location.origin + location.pathname + location.search;
            if( location.options.referer !== href ) {
                if( location.options.popstate )
                    location.load( event, href, false );
                else
                    location.assign( href );
            }
        } );
        if( location.options.refresh ) {
            var meta = document.querySelector( 'meta[http-equiv="refresh"]' );
            if( meta ) {
                location.timeout = setTimeout( function() {
                    location.load( event, href, true );
                }, parseInt( meta.content ) * 1000 );
                meta.remove();
            }
        }
        document.addEventListener( 'submit', function( event ) {
            if( location.options.submit ) {
                var form = event.target.closest( 'form' );
                if( form.matches( 'form[data-location]' ) ) {
                    if( form.method === 'get' && form.enctype === 'application/x-www-form-urlencoded' ) {
                        event.preventDefault();
                        location.load( event, form.action + ( form.action.indexOf( '?' ) === -1 ? '?' : '&' ) + new URLSearchParams( new FormData( form ) ).toString(), true );
                    }
                }
            }
        } );
    }
    catch( exception ) {
       console.error( exception );
    }
} )();
