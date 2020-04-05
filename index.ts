import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

let octokit:github.GitHub;
let context:Context;

function createPR(baseBranch:string, headBranch:string, title:string, body:string) {
    octokit.pulls.create({
        ...context.repo,
        base: baseBranch,
        head: headBranch,
        title,
        body,
    });
}

function createBranch(name:string, sha:string) {
    octokit.git.createRef({
        ...context.repo,
        ref: 'ref/heads/' + name,
        sha,
    });
}

function updateMergeBranch(name:string, sha:string) {
    octokit.git.updateRef({
        ...context.repo,
        ref: 'ref/heads/' + name,
        sha,
    });
}

async function doesBranchExist(name:string):Promise<boolean> {
    const matchingResults = await octokit.git.listMatchingRefs({
        ...context.repo,
        ref: 'heads/' + name
    });

    return matchingResults.data.length > 0;
}

async function doesPullRequestExist(headBranchName:string) {
    const matchingResults = await octokit.pulls.list({
        ...context.repo,
        state: 'open',
        head: headBranchName, // TODO Don't know if we need organization here
    });

    return matchingResults.data.length > 0;
}

async function run() {
    // Get config
    const fromBrach = core.getInput('from-branch');
    const toBranch = core.getInput('to-branch');
    const token = core.getInput('github-token');
    const autoMerge = core.getInput('auto-merge') == 'true' ? true : false;

    octokit = new github.GitHub(token);
    context = github.context;

    // TODO Compare branches
    const branchName = `merge-from-${fromBrach}-to-${toBranch}`;

    // TODO Merge branch if auto merge is on

    const inConflict = false;
    const headBranch = fromBrach; // TODO Straigth merge?
    const isExistingMergeBranch = await doesBranchExist(branchName);
    var isExistingPR = false;

    // Create merge branch if conflict or update existing branch
    if (isExistingMergeBranch) {
        // TODO Update reference with added commits
        updateMergeBranch(branchName, context.sha);
        isExistingPR = await doesPullRequestExist(branchName);
    } else {
        createBranch(branchName, context.sha);
    }

    // Create PR if no auto merge or conflict
    if (!isExistingPR && (!autoMerge || inConflict)) {
        createPR(branchName, toBranch, 'TODO Title', 'TODO Body');
    }
}

run().catch(core.setFailed)
